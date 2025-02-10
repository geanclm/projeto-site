import os
import subprocess
import platform


class TaskScheduled:
    @staticmethod
    def validate_python_script(python_script_path):
        """Valida se o script Python fornecido existe."""
        if not os.path.exists(python_script_path):
            raise FileNotFoundError(f"O script Python '{python_script_path}' não foi encontrado.")

    @staticmethod
    def get_python_executable():
        """Obtém o caminho do executável Python."""
        try:
            if platform.system() == "Windows":
                python_executable = subprocess.check_output(['where', 'python'], text=True).strip().split('\n')[0]
            else:
                python_executable = subprocess.check_output(['which', 'python3'], text=True).strip()
            return os.path.abspath(python_executable)
        except Exception as e:
            raise EnvironmentError("Não foi possível localizar o executável do Python no sistema.") from e

    @staticmethod
    def create_task(task_name, python_script_path, schedule_type='DAILY', time='22:00'):
        """Cria a tarefa agendada no sistema operacional apropriado."""
        TaskScheduled.validate_python_script(python_script_path)

        python_executable = TaskScheduled.get_python_executable()
        os_name = platform.system()

        if os_name == "Windows":
            command = [
                'schtasks',
                '/Create',
                '/TN', task_name,
                '/TR', f'"{python_executable}" "{python_script_path}" --task_name {task_name}',
                '/SC', schedule_type.upper(),
                '/ST', time,
            ]
        elif os_name == "Linux":
            command = f'(crontab -l ; echo "{time} {python_executable} {python_script_path} --task_name {task_name}") | crontab -'
        elif os_name == "Darwin":  # macOS
            plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
            <plist version="1.0">
            <dict>
                <key>Label</key>
                <string>{task_name}</string>
                <key>ProgramArguments</key>
                <array>
                    <string>{python_executable}</string>
                    <string>{python_script_path}</string>
                    <string>--task_name</string>
                    <string>{task_name}</string>
                </array>
                <key>StartCalendarInterval</key>
                <dict>
                    <key>Hour</key>
                    <integer>{int(time.split(':')[0])}</integer>
                    <key>Minute</key>
                    <integer>{int(time.split(':')[1])}</integer>
                </dict>
            </dict>
            </plist>
            """
            plist_path = os.path.expanduser(f"~/Library/LaunchAgents/{task_name}.plist")
            with open(plist_path, "w") as plist_file:
                plist_file.write(plist_content)
            command = ["launchctl", "load", plist_path]
        else:
            raise NotImplementedError("Sistema operacional não suportado para agendamento.")

        try:
            if os_name in ["Windows", "Darwin"]:
                subprocess.run(command, check=True, text=True, shell=True)
            elif os_name == "Linux":
                subprocess.run(command, shell=True, check=True)
            print(f"Tarefa '{task_name}' criada com sucesso no sistema operacional {os_name}!")
        except subprocess.CalledProcessError as e:
            print(f"Erro ao criar a tarefa: {e}")
            raise

    @staticmethod
    def delete_task(task_name):
        """Remove a tarefa agendada no sistema operacional apropriado."""
        os_name = platform.system()

        if os_name == "Windows":
            command = [
                'schtasks',
                '/Delete',
                '/TN', task_name,
                '/F'
            ]
        elif os_name == "Linux":
            command = f"crontab -l | grep -v '{task_name}' | crontab -"
        elif os_name == "Darwin":  # macOS
            plist_path = os.path.expanduser(f"~/Library/LaunchAgents/{task_name}.plist")
            command = ["launchctl", "unload", plist_path]
            try:
                os.remove(plist_path)
            except FileNotFoundError:
                pass
        else:
            raise NotImplementedError("Sistema operacional não suportado para remoção de agendamento.")

        try:
            if os_name in ["Windows", "Darwin"]:
                subprocess.run(command, check=True, text=True, shell=True)
            elif os_name == "Linux":
                subprocess.run(command, shell=True, check=True)
            print(f"Tarefa '{task_name}' removida com sucesso no sistema operacional {os_name}!")
        except subprocess.CalledProcessError as e:
            print(f"Erro ao remover a tarefa: {e}")
            raise

    @staticmethod
    def list_tasks():
        """Lista todas as tarefas agendadas no sistema operacional apropriado."""
        os_name = platform.system()

        if os_name == "Windows":
            command = [
                'schtasks',
                '/Query',
                '/FO', 'TABLE'
            ]
        elif os_name == "Linux":
            command = "crontab -l"
        elif os_name == "Darwin":  # macOS
            command = ["launchctl", "list"]
        else:
            raise NotImplementedError("Sistema operacional não suportado para listagem de agendamentos.")

        try:
            if os_name in ["Windows", "Darwin"]:
                result = subprocess.check_output(command, text=True, shell=True)
            elif os_name == "Linux":
                result = subprocess.check_output(command, shell=True, text=True)
            print(f"Tarefas agendadas no sistema operacional {os_name}:")
            print(result)
        except subprocess.CalledProcessError as e:
            print(f"Erro ao listar as tarefas: {e}")
            raise


"""
# Exemplo de uso
if __name__ == "__main__":
   
    task_name = "MinhaTarefa"
    
    python_script = os.path.join("D:\\GOOGLE DRIVE\\Python-Projects\\crewai_2\\groups\\","poema.py")
    
    # Cria a tarefa agendada
    try:
        TaskScheduled.create_task(task_name, python_script, schedule_type='DAILY', time='11:13')
    except Exception as e:
        print(f"Erro ao criar a tarefa: {e}")

 
    # Remove a tarefa agendada
    try:
        TaskScheduled.delete_task(task_name)
    except Exception as e:
        print(f"Erro ao deletar a tarefa: {e}")

    # Lista as tarefas agendadas
    try:
        TaskScheduled.list_tasks()
    except Exception as e:
        print(f"Erro ao listar as tarefas: {e}")
"""