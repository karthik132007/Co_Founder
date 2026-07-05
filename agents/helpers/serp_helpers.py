import serpapi
import os
api = os.getenv('SERP_API_KEY')

client = serpapi.Client(api_key=api)

def search_google_trends(query:str):
    results = client.search({
        "engine":"google_trends",
        "q":query,
        "date":"today 12-m",
        "data_type":"TIMESERIES"
    })
    return results.get("interest_over_time", [])

def search_google_news(query:str):
    results = client.search({
        "engine": "google_news",
        "q": query,
    })
    return results.get("news_results", [])

def search_google_shopping(query:str):
    results = client.search({
        "engine": "google_shopping",
        "q": query,
    })
    return results.get("shopping_results", [])
