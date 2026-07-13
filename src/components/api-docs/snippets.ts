export type Snippet = { id: string; label: string; lang: string; code: string };

export function buildSnippets(url: string): Snippet[] {
  return [
    {
      id: "curl",
      label: "cURL",
      lang: "bash",
      code: `curl -s "${url}"`,
    },
    {
      id: "javascript",
      label: "JavaScript",
      lang: "javascript",
      code: `fetch("${url}")
  .then((res) => res.json())
  .then((json) => console.log(json));`,
    },
    {
      id: "node",
      label: "Node.js",
      lang: "javascript",
      code: `// Node 18+ (global fetch)
const res = await fetch("${url}");
const json = await res.json();
console.log(json);`,
    },
    {
      id: "python",
      label: "Python",
      lang: "python",
      code: `import requests

res = requests.get("${url}")
print(res.json())`,
    },
    {
      id: "php",
      label: "PHP",
      lang: "php",
      code: `<?php
$json = file_get_contents("${url}");
$data = json_decode($json, true);
print_r($data);`,
    },
    {
      id: "ruby",
      label: "Ruby",
      lang: "ruby",
      code: `require "net/http"
require "json"

uri = URI("${url}")
data = JSON.parse(Net::HTTP.get(uri))
puts data`,
    },
    {
      id: "go",
      label: "Go",
      lang: "go",
      code: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	resp, _ := http.Get("${url}")
	defer resp.Body.Close()

	var data any
	json.NewDecoder(resp.Body).Decode(&data)
	fmt.Println(data)
}`,
    },
    {
      id: "rust",
      label: "Rust",
      lang: "rust",
      code: `// First add the dependency: cargo add reqwest --features blocking
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let body = reqwest::blocking::get("${url}")?.text()?;
    println!("{}", body);
    Ok(())
}`,
    },
    {
      id: "java",
      label: "Java",
      lang: "java",
      code: `import java.net.URI;
import java.net.http.*;

var client = HttpClient.newHttpClient();
var request = HttpRequest.newBuilder(URI.create("${url}")).build();
var response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());`,
    },
    {
      id: "c",
      label: "C",
      lang: "c",
      code: `// libcurl
#include <curl/curl.h>

int main(void) {
    CURL *curl = curl_easy_init();
    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "${url}");
        curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }
    return 0;
}`,
    },
    {
      id: "csharp",
      label: "C#",
      lang: "csharp",
      code: `using System.Net.Http;

using var client = new HttpClient();
string json = await client.GetStringAsync("${url}");
Console.WriteLine(json);`,
    },
    {
      id: "swift",
      label: "Swift",
      lang: "swift",
      code: `import Foundation

let url = URL(string: "${url}")!
let (data, _) = try await URLSession.shared.data(from: url)
print(String(data: data, encoding: .utf8)!)`,
    },
  ];
}
