# AireGPT Live Map

A real-time air quality monitoring map application that displays data from the Smability Network sensors across Mexico City. The application provides live air quality index (IAS) readings, historical data visualization, and interactive mapping features.

## 🌟 Features

- **Real-time Air Quality Monitoring**: Live data from multiple sensor stations
- **Interactive Map**: Mapbox-powered map with geolocation and navigation controls
- **Historical Data Charts**: Plotly.js charts showing sensor data trends
- **Responsive Design**: Mobile and desktop-friendly interface
- **Multi-sensor Support**: Temperature, humidity, CO, O3, PM2.5, and PM10 monitoring
- **AI Assistant Integration**: Direct link to AireGPT air quality assistant

## 🏗️ Architecture

The application is built using a modular architecture with separated concerns:

```
├── network/map.html          # Main application entry point
├── assets/css/map.css        # Styling and responsive design
├── assets/js/
│   ├── config.js            # Configuration and constants
│   ├── map.js               # Map initialization and controls
│   ├── sensors.js           # Sensor data management
│   ├── chart.js             # Chart functionality
│   └── utils.js             # Utility functions
```

## 🚀 Deployment

### Automatic Deployment via cPanel

The repository is configured for automatic deployment to cPanel hosting:

1. **Connect Repository**: Link your cPanel account to this GitHub repository
2. **Configure Branch**: Set `main` branch for production deployment
3. **Deploy**: Push changes to trigger automatic deployment

The `.cpanel.yml` file handles the deployment process automatically.

### Manual Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/airegptlivemap.git
   ```

2. Upload files to your web server:
   - Copy the `network/` directory to your web root
   - Ensure the URL structure matches: `yourdomain.com/network/map.html`

## 🔧 Configuration

### API Configuration

Edit `assets/js/config.js` to update:

- **Mapbox Token**: Update `MAPBOX_CONFIG.accessToken`
- **API Endpoints**: Modify `API_CONFIG` for different data sources
- **Sensor Tokens**: Update `API_CONFIG.tokens` for new sensors
- **CORS Proxies**: Add/modify proxy services in `CORS_PROXIES`

### Map Customization

- **Map Style**: Change `MAPBOX_CONFIG.style` for different map themes
- **Initial View**: Adjust `center` and `zoom` in `MAPBOX_CONFIG`
- **Sensor Stations**: Update `APP_SETTINGS.activeStations` array

## 📊 Data Sources

The application connects to the Smability API endpoints:

- **Real-time Data**: `http://smability.sidtecmx.com/SmabilityAPI/BioBox`
- **Historical Data**: `http://smability.sidtecmx.com/SmabilityAPI/GetData`

### Supported Sensors

| Sensor ID | Parameter | Units |
|-----------|-----------|-------|
| 2 | Carbon Monoxide | ppb |
| 3 | Relative Humidity | % |
| 7 | Ozone | ppb |
| 9 | PM2.5 | μg/m³ |
| 12 | Temperature | °C |

## 🎨 Styling

The application uses a responsive CSS design with:

- **Mobile-first approach**: Optimized for mobile devices
- **Desktop enhancements**: Enhanced features for larger screens
- **Custom color scheme**: Air quality index color coding
- **Smooth animations**: CSS transitions and hover effects

## 🔄 Real-time Updates

- **Auto-refresh**: Sensor data updates every 3 seconds
- **Popup updates**: Live updates in open information popups
- **Marker colors**: Dynamic color changes based on air quality
- **Chart data**: Real-time chart updates when panel is open

## 🛠️ Development

### Local Development

1. Clone the repository
2. Open `network/map.html` in a web browser
3. For local server (recommended):
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### Code Structure

- **Modular JavaScript**: Separated by functionality
- **Configuration-driven**: Easy to modify without code changes
- **Error handling**: Comprehensive error handling and retry logic
- **Performance optimized**: Efficient data fetching and rendering

## 📱 Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Mobile browsers**: iOS Safari, Chrome Mobile
- **Mapbox GL JS**: Requires WebGL support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Application**: [https://smability.io/network/map.html](https://smability.io/network/map.html)
- **Smability Website**: [https://smability.io](https://smability.io)
- **AI Assistant**: [https://smability.netlify.app/](https://smability.netlify.app/)

## 📞 Support

For questions or support:

- **WhatsApp**: +52 55 1956 6483
- **Website**: [smability.io](https://smability.io)
- **GitHub Issues**: Use the repository's issue tracker

## 🏷️ Version

Current Version: 1.0.0

---

Built with ❤️ for better air quality monitoring in Mexico City.
