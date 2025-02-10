from group_controller import GroupController
controller = GroupController()
groups = controller.fetch_groups()

for grupo in groups:
    print(f"Grupo ID: {grupo.group_id}, Nome: {grupo.name}")