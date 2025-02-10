from flask import Flask, request
from classes import SendEvolution
from classes import ReceiveEvolution

app = Flask(__name__)

# @app.route("/")
# def hello():
#     return "Hello World!"

# endereço para receber mensagens no evolution
# http://192.168.0.2:5000
# http://host.docker.internal:5000

@app.route("/messages-upsert", methods=['POST'])
def webhook():
    try:
        data = request.get_json()        
        msg = ReceiveEvolution(data)
        send = SendEvolution()
        send.textMessage(number=msg.phone,
                         msg=f'{msg.text_message} - resposta do servidor')
    except:
        print("Erro")        
    return ""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)