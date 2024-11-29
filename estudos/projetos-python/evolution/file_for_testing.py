import datetime

loteca = '1161_'
hoje = str(datetime.datetime.today().date())
part1 = 'search_result_'
part2 = '.md'
file_name = part1+loteca+hoje+part2

print(file_name)