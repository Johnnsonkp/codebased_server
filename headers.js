import config from "./config.cjs"

export const headerOptions = {
  "Access-Control-Allow-Origin": "*",
  Authorization: `Bearer ${config.githubToken}`,
  "Accept": "application/vnd.github.raw+json",
  "content-type": "text/plain",
  'X-Github-Api-Version': '2022-11-28'
}

export const headerOptions2 = {
  "Access-Control-Allow-Origin": "*",
  Authorization: `Bearer ${config.githubToken}`,
  "Accept": "application/vnd.github.raw+json",
  "content-Type": "application/json",
  'X-Github-Api-Version': '2022-11-28'
}

export const headerOptions3 = {
  "Access-Control-Allow-Origin": "*",
  Authorization: `Bearer ${config.githubToken}`,
  "Accept": "application/vnd.github.raw+json",
  "content-Type": "application/json",
  'X-Github-Api-Version': '2022-11-28'
}
