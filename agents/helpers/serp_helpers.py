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
    interest_over_time = results["interest_over_time"]
    return interest_over_time

def search_google_news(query:str):
    results = client.search({
        "engine": "google_news",
        "q": query,
    })
    news_results = results["news_results"]
    return news_results["news_results"]

def search_google_shopping(query:str):
    results = client.search({
        "engine": "google_shopping",
        "q": query,
    })
    shopping_results = results["shopping_results"]
    return shopping_results["shopping_results"]
