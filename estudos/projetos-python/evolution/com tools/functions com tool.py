# def create_agent(role, goal, backstory, tools, model, max_iter, verbose, memory, allow_delegation):
#     try:
#         return Agent(
#             role=role,
#             goal=goal,
#             backstory=backstory,
#             tools=tools,
#             llm=model,
#             max_iter=max_iter,
#             verbose=verbose,
#             memory=memory,
#             allow_delegation=allow_delegation,
#         )
#     except Exception as e:
#         print(f"Erro ao criar agente: {e}")
#         return None

# def create_task(description, expected_output, agent, allow_delegation, output_file):
#     try:
#         return Task(
#             description=description,
#             expected_output=expected_output,
#             agent=agent,
#             allow_delegation=allow_delegation,
#             output_file= output_file
#         )
#     except Exception as e:
#         print(f"Erro ao criar tarefa: {e}")
#         return None

# def create_crew(agents, tasks, process):
#     try:
#         return Crew(
#             agents=agents,
#             tasks=tasks,
#             process=process
#         )
#     except Exception as e:
#         print(f"Erro ao criar a equipe (crew): {e}")
#         return None