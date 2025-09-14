import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Thermometer, Droplets, Wind, Eye, Sun, Cloud, CloudRain, Zap 
} from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
}

interface ForecastDay {
  date: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

// Background gradients depending on weather
const WEATHER_BACKGROUNDS: Record<string, string> = {
  clear: 'from-blue-400 via-blue-500 to-blue-600',
  clouds: 'from-gray-400 via-gray-500 to-gray-600',
  rain: 'from-gray-600 via-gray-700 to-gray-800',
  snow: 'from-blue-200 via-blue-300 to-blue-400',
  thunderstorm: 'from-gray-800 via-gray-900 to-black',
  mist: 'from-gray-300 via-gray-400 to-gray-500',
  default: 'from-blue-400 via-blue-500 to-blue-600'
};

// Maps weather conditions to icons
const WeatherIcon: React.FC<{ condition: string; size?: number }> = ({ condition, size = 48 }) => {
  const commonProps = { size, className: "text-white drop-shadow-lg" };

  switch (condition.toLowerCase()) {
    case 'clear': return <Sun {...commonProps} className={`${commonProps.className} animate-pulse`} />;
    case 'clouds': return <Cloud {...commonProps} />;
    case 'rain': return <CloudRain {...commonProps} />;
    case 'thunderstorm': return <Zap {...commonProps} className={`${commonProps.className} animate-pulse`} />;
    default: return <Sun {...commonProps} />;
  }
};

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);

  // Mock data to simulate API response
  const mockWeather: WeatherData = {
    location: 'New York, NY',
    temperature: 22,
    feels_like: 25,
    condition: 'Clear',
    description: 'Clear sky',
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    icon: 'clear'
  };

  const mockForecast: ForecastDay[] = [
    { date: 'Today', high: 25, low: 18, condition: 'Clear', icon: 'clear' },
    { date: 'Tomorrow', high: 23, low: 16, condition: 'Clouds', icon: 'clouds' },
    { date: 'Wed', high: 20, low: 14, condition: 'Rain', icon: 'rain' },
    { date: 'Thu', high: 24, low: 17, condition: 'Clear', icon: 'clear' },
    { date: 'Fri', high: 26, low: 19, condition: 'Clear', icon: 'clear' }
  ];

  // Simulate fetching data on mount
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setWeather(mockWeather);
      setForecast(mockForecast);
      setLoading(false);
    }, 1000);
  }, []);

  // Search for a city
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    // Mock API call
    setTimeout(() => {
      setWeather({ ...mockWeather, location: query });
      setQuery('');
      setLoading(false);
    }, 1000);
  };

  // Use browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => setTimeout(() => { setWeather({ ...mockWeather, location: 'Current Location' }); setLoading(false); }, 1000),
      () => { setError('Unable to get your location'); setLoading(false); }
    );
  };

  // Convert temperature based on user preference
  const convertTemp = (temp: number) => isCelsius ? temp : Math.round((temp * 9/5) + 32);

  // Pick background based on weather
  const backgroundClass = weather ? WEATHER_BACKGROUNDS[weather.condition.toLowerCase()] || WEATHER_BACKGROUNDS.default : WEATHER_BACKGROUNDS.default;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundClass} transition-all duration-1000`}>
      <div className="min-h-screen backdrop-blur-sm bg-black/10">
        <div className="container mx-auto px-4 py-8">

          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">Weather</h1>
            <p className="text-white/80 text-lg">Beautiful weather, beautifully presented</p>
          </header>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for a city..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all duration-300"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70" size={20} />
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all duration-300">
                <Search className="text-white" size={16} />
              </button>
            </form>

            <button
              onClick={getCurrentLocation}
              className="w-full mt-3 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md border border-white/30"
            >
              <MapPin size={16} /> Use Current Location
            </button>
          </div>

          {/* Error */}
          {error && <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white text-center">{error}</div>}

          {/* Loading */}
          {loading && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 mb-6 border border-white/20 animate-pulse">
                <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-white/20 rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 bg-white/20 rounded"></div>
                  <div className="h-16 bg-white/20 rounded"></div>
                  <div className="h-16 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          )}

          {/* Weather Card */}
          {weather && !loading && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

              {/* Current Weather */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">{weather.location}</h2>
                    <p className="text-white/70">{weather.description}</p>
                  </div>
                  <button
                    onClick={() => setIsCelsius(!isCelsius)}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 backdrop-blur-md border border-white/30"
                  >
                    °{isCelsius ? 'C' : 'F'}
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                  <WeatherIcon condition={weather.condition} size={80} />
                  <div>
                    <div className="text-6xl font-light text-white mb-2">{convertTemp(weather.temperature)}°</div>
                    <p className="text-white/70">Feels like {convertTemp(weather.feels_like)}°</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/20">
                    <Thermometer className="mx-auto mb-2 text-white/80" size={24} />
                    <p className="text-white/70 text-sm">Feels like</p>
                    <p className="text-white font-semibold">{convertTemp(weather.feels_like)}°</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/20">
                    <Droplets className="mx-auto mb-2 text-white/80" size={24} />
                    <p className="text-white/70 text-sm">Humidity</p>
                    <p className="text-white font-semibold">{weather.humidity}%</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/20">
                    <Wind className="mx-auto mb-2 text-white/80" size={24} />
                    <p className="text-white/70 text-sm">Wind Speed</p>
                    <p className="text-white font-semibold">{weather.windSpeed} km/h</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm border border-white/20">
                    <Eye className="mx-auto mb-2 text-white/80" size={24} />
                    <p className="text-white/70 text-sm">Visibility</p>
                    <p className="text-white font-semibold">{weather.visibility} km</p>
                  </div>
                </div>
              </div>

              {/* 5-Day Forecast */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-6">5-Day Forecast</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {forecast.map((day, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl p-4 text-center hover:bg-white/15 transition-all duration-300 backdrop-blur-sm border border-white/20">
                      <p className="text-white/70 text-sm mb-2">{day.date}</p>
                      <WeatherIcon condition={day.condition} size={32} />
                      <div className="mt-2">
                        <p className="text-white font-semibold">{convertTemp(day.high)}°</p>
                        <p className="text-white/60 text-sm">{convertTemp(day.low)}°</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
