from gradio_client import Client

# Tạo client một lần (không tạo lại mỗi lần gọi)
client = Client("yuntian-deng/ChatGPT")

def call_gradio_ai(prompt: str) -> str:
    """
    Gửi prompt lên mô hình ChatGPT trên HuggingFace Spaces (Gradio)
    và trả về text kết quả.
    """
    result = client.predict(
        inputs=prompt,
        top_p=1,
        temperature=1,
        chat_counter=0,
        chatbot=[],
        api_name="/predict_1"
    )
    
    return result[0][0][1]

