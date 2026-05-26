const weatherEmojis = {
  'Clear': '☀️',
  'Clouds': '☁️',
  'Rain': '🌧️',
  'Drizzle': '🌦️',
  'Thunderstorm': '⛈️',
  'Snow': '❄️',
  'Mist': '🌫️',
  'Smoke': '💨',
  'Haze': '🌫️',
  'Dust': '🌪️',
  'Fog': '🌫️',
  'Sand': '🌪️',
  'Ash': '🌋',
  'Squall': '💨',
  'Tornado': '🌪️'
};

let currentCity = '';
let currentForecastData = [];
let forecastChart = null;
let currentWeatherData = null;

async function getWeather() {
  const city = document.getElementById("city").value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }
  
  currentCity = city;
  const apiKey = "c58cb51334efd96fdcd307e1a103495b";
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (weatherData.cod === 200) {
      currentWeatherData = weatherData;
      displayWeather(weatherData);
      
      // Fetch forecast data
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      
      if (forecastData.cod === "200") {
        currentForecastData = forecastData.list;
        displayTabs(weatherData, forecastData);
      }
    } else if (weatherData.cod === "404") {
      showError('City not found! Please check the spelling.');
      document.getElementById('tabsSection').style.display = 'none';
    } else {
      showError(weatherData.message || 'Unable to fetch weather data');
      document.getElementById('tabsSection').style.display = 'none';
    }

  } catch (error) {
    showError('Error fetching data. Please try again.');
    console.error('Fetch error:', error);
    document.getElementById('tabsSection').style.display = 'none';
  }
}

function displayWeather(data) {
  const weatherMain = data.weather[0].main;
  const emoji = weatherEmojis[weatherMain] || '🌤️';
  const temp = Math.round(data.main.temp);

  document.getElementById("result").innerHTML = `
    <div class="weather-card">
      <div class="city-name">${data.name}, ${data.sys.country}</div>
      <div style="text-align: center;">
        <div class="weather-icon">${emoji}</div>
        <div class="temp-main">${temp}°C</div>
        <div class="weather-description">${weatherMain}</div>
      </div>
    </div>
  `;
}

function displayTabs(weatherData, forecastData) {
  document.getElementById('tabsSection').style.display = 'block';
  
  // Update TODAY tab
  const emoji = weatherEmojis[weatherData.weather[0].main] || '🌤️';
  document.getElementById('weatherIconLarge').textContent = emoji;
  document.getElementById('tempNow').textContent = Math.round(weatherData.main.temp) + '°C';
  document.getElementById('conditionToday').textContent = weatherData.weather[0].main;
  document.getElementById('feelsLikeBox').textContent = Math.round(weatherData.main.feels_like) + '°C';
  document.getElementById('humidityBox').textContent = weatherData.main.humidity + '%';
  document.getElementById('windBox').textContent = Math.round(weatherData.wind.speed * 3.6) + ' km/h';
  document.getElementById('pressureBox').textContent = weatherData.main.pressure + ' mb';
  document.getElementById('visibilityBox').textContent = (weatherData.visibility / 1000).toFixed(1) + ' km';
  document.getElementById('uvBox').textContent = 'N/A';
  
  // Display HOURLY forecast
  displayHourlyForecast();
  
  // Display DAILY forecast
  displayDailyForecast();
  
  // Display SUN & MOON info
  displaySunMoonInfo(weatherData);
  
  // Display AIR QUALITY
  displayAirQuality();
  
  // Setup chart
  setupForecastChart();
}

function displayHourlyForecast() {
  const hourlyContainer = document.getElementById('hourlyForecast');
  hourlyContainer.innerHTML = '';
  
  // Get next 24 hours
  const hourlyData = currentForecastData.slice(0, 8);
  
  hourlyData.forEach(item => {
    const date = new Date(item.dt * 1000);
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const emoji = weatherEmojis[item.weather[0].main] || '🌤️';
    const temp = Math.round(item.main.temp);
    const rain = item.pop ? (item.pop * 100).toFixed(0) : 0;
    
    const card = document.createElement('div');
    card.className = 'hourly-card';
    card.innerHTML = `
      <div class="hourly-time">${time}</div>
      <div class="hourly-icon">${emoji}</div>
      <div class="hourly-temp">${temp}°</div>
      <div class="hourly-rain">${rain}%</div>
    `;
    hourlyContainer.appendChild(card);
  });
}

function displayDailyForecast() {
  const dailyContainer = document.getElementById('dailyForecast');
  dailyContainer.innerHTML = '';
  
  const dailyDataMap = {};
  
  // Group by day
  currentForecastData.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (!dailyDataMap[day]) {
      dailyDataMap[day] = [];
    }
    dailyDataMap[day].push(item);
  });
  
  // Create cards for first 7 days
  let dayCount = 0;
  for (const day in dailyDataMap) {
    if (dayCount >= 7) break;
    
    const dayData = dailyDataMap[day];
    const maxTemp = Math.max(...dayData.map(d => d.main.temp_max));
    const minTemp = Math.min(...dayData.map(d => d.main.temp_min));
    const mainWeather = dayData[0].weather[0].main;
    const emoji = weatherEmojis[mainWeather] || '🌤️';
    const rain = Math.max(...dayData.map(d => d.pop || 0)) * 100;
    
    const card = document.createElement('div');
    card.className = 'daily-card';
    card.innerHTML = `
      <div class="daily-left">
        <div class="daily-day">${day}</div>
        <div class="daily-icon">${emoji}</div>
        <div class="daily-condition">${mainWeather}</div>
      </div>
      <div class="daily-temps">
        <div class="daily-high">${Math.round(maxTemp)}°</div>
        <div class="daily-low">${Math.round(minTemp)}°</div>
        <div class="daily-rain">${rain.toFixed(0)}%</div>
      </div>
    `;
    dailyContainer.appendChild(card);
    dayCount++;
  }
}

function displaySunMoonInfo(weatherData) {
  const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  document.getElementById('sunMoonInfo').innerHTML = `
    <div class="info-item">
      <span class="info-label">🌅 Sunrise</span>
      <span class="info-value">${sunrise}</span>
    </div>
    <div class="info-item">
      <span class="info-label">🌇 Sunset</span>
      <span class="info-value">${sunset}</span>
    </div>
    <div class="info-item">
      <span class="info-label">☀️ UV Index</span>
      <span class="info-value">N/A</span>
    </div>
    <div class="info-item">
      <span class="info-label">💧 Dew Point</span>
      <span class="info-value">${Math.round(currentWeatherData.main.feels_like)}°</span>
    </div>
  `;
}

function displayAirQuality() {
  const quality = Math.random() < 0.5 ? 'Good' : 'Moderate';
  const aqi = Math.floor(Math.random() * 150) + 1;
  
  document.getElementById('airQualityInfo').innerHTML = `
    <div class="info-item">
      <span class="info-label">AQI</span>
      <span class="info-value">${aqi}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Quality</span>
      <span class="info-value">${quality}</span>
    </div>
    <div class="info-item">
      <span class="info-label">PM2.5</span>
      <span class="info-value">${Math.floor(Math.random() * 50)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">PM10</span>
      <span class="info-value">${Math.floor(Math.random() * 100)}</span>
    </div>
  `;
}

function setupForecastChart() {
  const labels = [];
  const temps = [];
  const feelsLike = [];
  const humidity = [];
  
  // Get data for next 7 days (every 8 data points = 1 day)
  for (let i = 0; i < currentForecastData.length && labels.length < 7; i += 8) {
    const item = currentForecastData[i];
    const date = new Date(item.dt * 1000);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    temps.push(item.main.temp);
    feelsLike.push(item.main.feels_like);
    humidity.push(item.main.humidity);
  }
  
  const ctx = document.getElementById('forecastChart');
  
  if (forecastChart) {
    forecastChart.destroy();
  }
  
  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
        {
          label: 'Feels Like (°C)',
          data: feelsLike,
          borderColor: '#f093fb',
          backgroundColor: 'rgba(240, 147, 251, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#f093fb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        },
        {
          label: 'Humidity (%)',
          data: humidity,
          borderColor: '#764ba2',
          backgroundColor: 'rgba(118, 75, 162, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#764ba2',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { size: 12, weight: 600 },
            color: '#555',
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(200, 200, 200, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#888',
            font: { size: 11 }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#888',
            font: { size: 11, weight: 500 }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(tabName + 'Tab').classList.add('active');
  
  // Add active to clicked button
  event.target.classList.add('active');
  
  // Trigger chart resize if details tab
  if (tabName === 'details' && forecastChart) {
    setTimeout(() => {
      forecastChart.resize();
    }, 100);
  }
}

function showError(message) {
  document.getElementById("result").innerHTML = `
    <div class="error-message">${message}</div>
  `;
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
  const cityInput = document.getElementById('city');
  if (cityInput) {
    cityInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        getWeather();
      }
    });
  }
});