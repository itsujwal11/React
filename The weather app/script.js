const apiKey = '251506d7409997036f27a381327bde97';
const apiBase = 'https://api.openweathermap.org/data/2.5/weather';
const cityInput = document.getElementById('cityInput');
const useLocationButton = document.getElementById('useLocationButton');
const weatherDisplay = document.getElementById('weatherDisplay');
const errorDisplay = document.getElementById('errorDisplay');

async function getWeather(city){
    try {
const response = await fetch(`${apiBase}?q=${city}&units=metric&appid=${apiKey}`);
if (!response.ok) throw new Error('City not found');
const data = await response.json();

    } catch (error) {
        alert(error.message);
}
}
async function getWeatherByCoords(lat, lon){
    try {
const response = await fetch(`${apiBase}?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
if (!response.ok) throw new Error('Location not found');
const data = await response.json();
displayWeather(data);
    } catch (error) {
        alert(error.message);
}
}

function updateWeather(data) {
    document.getElementById('location').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('condition').textContent = data.weather[0].description;
document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
 document.getElementById('temperature').textContent = Math.round(data.main.temp);
 document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°`;
 document.getElementById('feels-like-detail').textContent = `${Math.round(data.main.feels_like)}°`;
 document.getElementById('humidity-detail').textContent = `${data.main.humidity}%`;
}

window.onload = () =>  getWeather('New York');
cityInput.addEventListener('keypress', (e) => {
    if(event.key === 'Enter' && cityInput.value){
        getWeather(cityInput.value);
        cityInput.value = '';
    }
});
useLocationButton.addEventListener('click', () => {
    if(NavigationActivation.geoLocation){
        navigator.geolocation.getCurrentPosition((position) => getWeatherByCoords(position.coords.latitude, position.coords.longitude),
        () => alert('Unable to retrieve your location'));
    }else{
        alert('Geolocation is not supported by your browser');
    }
});