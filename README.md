# Project 3: big_foot_data_analysis

Where does bigfoot venture?

 In this project, we have created an interface that allows user interactivity to query  bigfoot sightings across the continental US.

Our data originated from a csv compiled on dataworld by Timothy Renner who scraped data from [https://www.bfro.net](https://www.bfro.net/). The data obtained was cleaned in python, and the csv created was used to create a sqlite database file. Then, Python Flask was used to load the data from the sqlite file to the server and projects it at the "/data" endpoint in a JSON format. The JavaScript file references the 'index.html' file rendered by Flask in order to create visualizations that allows for user interactivity.

The website displays a dropdown where the user can select a state to explore for bigfoot sightings and  view and interact with some of the visualizations. The visualizations' information will update based on the selection of the user (All States is set as default).  When a state is selected, a bar graph willl display the sightings per season where each bar will represent a season.

![bf-bar graph](https://user-images.githubusercontent.com/115592072/221435130-e892575e-ec90-48b8-a2a9-83b3c64d2cdd.png)

The second visualization is a line graph that displays the number of sighting on the y axis and the year it was sighted on the x axis. 

![bf line graph](https://user-images.githubusercontent.com/115592072/221435054-db38879b-3cf2-4f67-b161-58dd11694b6a.png)


The third visualization is a cluster map. The latitude and longitude provided in the data is used to show the point of the sighting by zooming in or clicking on a specific cluster. Clicking on the point of sighting will also show a report number, the date of the sighting, and a detailed report of the sighting .

![bf cluster map](https://user-images.githubusercontent.com/115592072/221435147-41af046e-2335-4bef-bcdf-767d410c32a2.png)

Lastly, a statistics panel that will display the total number of sightings in that specific state, the most visited county, and the averages for temperature,precipitation intensity, wind speed, humidity, cloud cover, visibility, and pressure.

![bd statistics panel](https://user-images.githubusercontent.com/115592072/221435159-900060c7-4756-4d79-841a-8c07f69a630a.png)


**Shortcomings:**

Most bigfoot sightings happen when people are partaking in various outdoor activities, so the amount of bigfoot activity during weather conditions not ideal for humans is yet to be determined, and this data likely skews unfairly in favor of moderate weather conditions. The weather is calculated and based on the average weather for the day, so trying to coordinate a  bigfoot sighting based on weather would probably not be the way since weather temperature can vary throughout the day.


**Team Members:**

Lea Jinks

Danielle Anderson

Sina Rafiee

Angel Toscano

Marissa Gallegos
