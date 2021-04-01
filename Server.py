from bs4 import BeautifulSoup
import requests
for i in range(1,10):
    url = "https://www.youtube.com/results?search_query=php+tutorial"+"&page="+str(i)
    source = requests.get(url).text
    code = BeautifulSoup(source,'lxml')
    print(code.prettify())
