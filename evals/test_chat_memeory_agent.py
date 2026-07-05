
from agents.util_agents.chat_memory_creator import create_chat_memory

conversation = [
    {
        "role": "agent",
        "content": "Hello! How can I help you today?"
    },
    {
        "role": "user",
        "content": "Hi! I’m starting a small coffee shop and need help with a business plan."
    },
    {
        "role": "agent",
        "content": "That’s great! Have you decided on a location or a target audience yet?"
    },
    {
        "role": "user",
        "content": "Yes, I’m thinking of opening it near a university campus, so mostly students and professors."
    },
    {
        "role": "agent",
        "content": "Nice. Do you have a name in mind, or any specific theme for the shop?"
    },
    {
        "role": "user",
        "content": "I’m calling it 'Brew & Brain' – kind of a study-friendly vibe with quiet corners and good Wi-Fi."
    },
    {
        "role": "agent",
        "content": "Love the name! What about your menu – are you focusing only on coffee, or will you have snacks too?"
    },
    {
        "role": "user",
        "content": "I’ll have pastries, sandwiches, and some vegan options. Also, cold brew and seasonal specials."
    },
    {
        "role": "agent",
        "content": "Sounds well-rounded. Have you thought about your pricing strategy compared to nearby competitors?"
    },
    {
        "role": "user",
        "content": "I’ll keep it slightly lower than Starbucks but higher than fast-food chains – mid-tier pricing."
    },
    {
        "role": "agent",
        "content": "Good positioning. What about your initial budget and funding sources?"
    },
    {
        "role": "user",
        "content": "I have about $30k saved, and I’m planning to take a small business loan for another $20k."
    },
    {
        "role": "agent",
        "content": "That’s a solid start. Do you have a timeline for launch, or are you aiming for a specific season?"
    },
    {
        "role": "user",
        "content": "I’d like to open by early fall – just before the semester starts."
    },
    {
        "role": "agent",
        "content": "Perfect. I’ll summarize what we’ve discussed so far and help you structure your business plan step by step."
    }
]

response = create_chat_memory(conversation)
print(response)