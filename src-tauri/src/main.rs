#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures_util::StreamExt;
use reqwest::{header::{HeaderMap, HeaderName, HeaderValue, ACCEPT_LANGUAGE, CONTENT_TYPE, USER_AGENT}, Client, Url};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::io::AsyncWriteExt;

const POCKET_API_ORIGIN: &str = "https://pocketapi.48.cn";
const ALLOWED_ENDPOINTS: &[&str] = &[
    "/idolanswer/api/idolanswer/v1/user/question/list",
    "/user/api/v1/login/app/mobile/code",
    "/user/api/v1/sms/send2",
    "/user/api/v1/user/info/reload",
    "/user/api/v1/bigsmall/switch/user",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PocketRequest {
    endpoint: String,
    body: Value,
    token: Option<String>,
    headers: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MediaCacheRequest {
    id: String,
    media_type: String,
    url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CachedMedia {
    path: String,
    bytes: u64,
    already_cached: bool,
}

fn set_header(headers: &mut HeaderMap, name: HeaderName, value: &str) -> Result<(), String> {
    let value = HeaderValue::from_str(value).map_err(|_| "请求头格式无效".to_string())?;
    headers.insert(name, value);
    Ok(())
}

fn build_headers(request: &PocketRequest) -> Result<HeaderMap, String> {
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json;charset=utf-8"));
    headers.insert(USER_AGENT, HeaderValue::from_static("PocketFans201807/7.1.30 (iPhone; iOS 17.7.2; Scale/3.00)"));
    headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("en-CN;q=1, zh-Hans-CN;q=0.9, ja-CN;q=0.8, es-CN;q=0.7"));

    if let Some(token) = &request.token {
        set_header(&mut headers, HeaderName::from_static("token"), token)?;
    }

    if let Some(custom_headers) = &request.headers {
        for (name, value) in custom_headers {
            let normalized = name.to_ascii_lowercase();
            let allowed_name = match normalized.as_str() {
                "appinfo" => Some(HeaderName::from_static("appinfo")),
                "pa" => Some(HeaderName::from_static("pa")),
                _ => None,
            };

            if let Some(allowed_name) = allowed_name {
                set_header(&mut headers, allowed_name, value)?;
            }
        }
    }

    Ok(headers)
}

#[tauri::command]
async fn pocket_request(request: PocketRequest) -> Result<Value, String> {
    if !ALLOWED_ENDPOINTS.contains(&request.endpoint.as_str()) {
        return Err("此桌面客户端不允许访问该接口".to_string());
    }

    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|error| format!("无法初始化网络连接: {error}"))?;
    let url = format!("{POCKET_API_ORIGIN}{}", request.endpoint);
    let response = client
        .post(url)
        .headers(build_headers(&request)?)
        .json(&request.body)
        .send()
        .await
        .map_err(|error| format!("网络连接失败，请检查网络后重试: {error}"))?;
    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|error| format!("无法读取接口响应: {error}"))?;

    if !status.is_success() {
        return Err(format!("接口请求失败 ({status}): {response_text}"));
    }

    serde_json::from_str(&response_text).map_err(|_| "接口返回了无法识别的数据".to_string())
}

fn validate_media_url(raw_url: &str) -> Result<Url, String> {
    let url = Url::parse(raw_url).map_err(|_| "媒体地址格式无效".to_string())?;
    if url.scheme() != "https" || !matches!(url.host_str(), Some("mp4.48.cn" | "source.48.cn")) {
        return Err("此桌面客户端不允许缓存该媒体地址".to_string());
    }
    Ok(url)
}

// FNV-1a 的稳定散列：仅用于生成不含用户内容的文件名，并非安全边界。
fn media_cache_key(url: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in url.bytes() {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

fn media_cache_path(app: &AppHandle, media_type: &str, url: &str) -> Result<std::path::PathBuf, String> {
    let (folder, extension) = match media_type {
        "audio" => ("audio", "aac"),
        "video" => ("video", "mp4"),
        _ => return Err("仅支持缓存音频或视频".to_string()),
    };
    let app_data = app
        .path()
        .app_local_data_dir()
        .map_err(|error| format!("无法定位应用缓存目录: {error}"))?;
    Ok(app_data
        .join("media")
        .join(folder)
        .join(format!("{}.{}", media_cache_key(url), extension)))
}

#[tauri::command]
async fn cache_media(app: AppHandle, request: MediaCacheRequest) -> Result<CachedMedia, String> {
    // id is deliberately accepted for API clarity, but never used to form a file path.
    if request.id.trim().is_empty() {
        return Err("媒体记录标识无效".to_string());
    }
    let url = validate_media_url(&request.url)?;
    let target = media_cache_path(&app, &request.media_type, url.as_str())?;

    if let Ok(metadata) = tokio::fs::metadata(&target).await {
        if metadata.is_file() && metadata.len() > 0 {
            return Ok(CachedMedia {
                path: target.to_string_lossy().into_owned(),
                bytes: metadata.len(),
                already_cached: true,
            });
        }
    }

    let parent = target.parent().ok_or_else(|| "媒体缓存目录无效".to_string())?;
    tokio::fs::create_dir_all(parent)
        .await
        .map_err(|error| format!("无法创建媒体缓存目录: {error}"))?;

    let client = Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|error| format!("无法初始化媒体下载: {error}"))?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|error| format!("媒体下载失败，请检查网络后重试: {error}"))?;
    if !response.status().is_success() {
        return Err(format!("媒体下载失败 ({})", response.status()));
    }

    let temporary = target.with_extension("part");
    let _ = tokio::fs::remove_file(&temporary).await;
    let mut file = tokio::fs::File::create(&temporary)
        .await
        .map_err(|error| format!("无法创建媒体缓存文件: {error}"))?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|error| format!("媒体下载中断: {error}"))?;
        file.write_all(&chunk)
            .await
            .map_err(|error| format!("无法写入媒体缓存: {error}"))?;
        downloaded += chunk.len() as u64;
    }
    file.flush()
        .await
        .map_err(|error| format!("无法完成媒体缓存: {error}"))?;
    drop(file);
    tokio::fs::rename(&temporary, &target)
        .await
        .map_err(|error| format!("无法保存媒体缓存: {error}"))?;

    Ok(CachedMedia {
        path: target.to_string_lossy().into_owned(),
        bytes: downloaded,
        already_cached: false,
    })
}

#[tauri::command]
async fn remove_cached_media(app: AppHandle, urls: Vec<String>) -> Result<usize, String> {
    let mut removed = 0;
    for raw_url in urls {
        let Ok(url) = validate_media_url(&raw_url) else {
            continue;
        };
        for media_type in ["audio", "video"] {
            let path = media_cache_path(&app, media_type, url.as_str())?;
            if tokio::fs::remove_file(path).await.is_ok() {
                removed += 1;
            }
        }
    }
    Ok(removed)
}

#[tauri::command]
async fn clear_all_cached_media(app: AppHandle) -> Result<(), String> {
    let media_root = app
        .path()
        .app_local_data_dir()
        .map_err(|error| format!("无法定位应用缓存目录: {error}"))?
        .join("media");
    match tokio::fs::remove_dir_all(&media_root).await {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("无法删除媒体缓存: {error}")),
    }
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            pocket_request,
            cache_media,
            remove_cached_media,
            clear_all_cached_media,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("启动桌面客户端失败");
}
