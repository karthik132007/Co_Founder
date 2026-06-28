def get_judge_prompt(v1: any, task: str) -> str:
    """
    Returns the prompt for the Judge .
    """
    prompt = f"""
    - You are a judge llm and ask to critique the output given by an llm for the following task: {task}.
    - You need to provide a detailed critique of the output, highlighting its weaknesses and areas for improvement.
    - Return only valid json in the following format:
    {
        "critique": "Your critique here",
        "suggestions": "Your suggestions here"
    }
    - Avoid providing any additional commentary or explanations outside of the JSON format.
    - Ensure that your critique is constructive and actionable, providing specific examples and recommendations for improvement.
    content to critique: {v1}
    """
    return prompt