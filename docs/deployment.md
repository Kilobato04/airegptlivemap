# Deployment Guide

This guide covers different deployment methods for the AireGPT Live Map application.

## 🚀 cPanel Git Deployment (Recommended)

### Initial Setup

1. **Login to cPanel**
   - Access your cPanel dashboard
   - Navigate to "Git Version Control" or "Git™ Version Control"

2. **Create Repository**
   - Click "Create"
   - Repository URL: `https://github.com/yourusername/airegptlivemap.git`
   - Repository Path: `/public_html/` (or your desired path)
   - Repository Name: `airegptlivemap`

3. **Configure Deployment**
   - The `.cpanel.yml` file will handle automatic deployment
   - Ensure your cPanel user has proper permissions

### Automatic Deployment Process

When you push to the `main` branch, cPanel will automatically:

1. Pull the latest changes
2. Copy files to the correct directories
3. Set proper file permissions
4. Make the application available at your domain

### URL Structure

After deployment, your application will be available at:
- Main map: `https://yourdomain.com/network/map.html`
- Assets: `https://yourdomain.com/network/assets/`

## 🔧 Manual Deployment

### Prerequisites

- FTP/SFTP access to your web server
- Web server with static file serving capability

### Steps

1. **Download/Clone Repository**
   ```bash
   git clone https://github.com/yourusername/airegptlivemap.git
   cd airegptlivemap
   ```

2. **Upload Files**
   - Upload the `network/` folder to your web root
   - Upload any additional assets if needed
   - Maintain the directory structure

3. **Set Permissions**
   ```bash
   chmod 644 network/map.html
   chmod 644 network/assets/css/*.css
   chmod 644 network/assets/js/*.js
   chmod 755 network/
   chmod 755 network/assets/
   chmod 755 network/assets/css/
   chmod 755 network/assets/js/
   ```

## 🌐 Domain Configuration

### DNS Settings

Ensure your domain points to your hosting server:

```
Type: A
Name: @
Value: [Your server IP]
TTL: 14400
```

### SSL Certificate

For production deployment, ensure SSL is configured:
- Use Let's Encrypt (free)
- Or upload your SSL certificate through cPanel

## 🔄 Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to cPanel
      uses: SamKirkland/FTP-Deploy-Action@4.0.0
      with:
        server: ${{ secrets.FTP_HOST }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        local-dir: ./network/
        server-dir: /public_html/network/
```

### Environment Variables

Set these secrets in your GitHub repository:
- `FTP_HOST`: Your cPanel hostname
- `FTP_USERNAME`: Your cPanel username
- `FTP_PASSWORD`: Your cPanel password

## 🔍 Deployment Verification

### Health Check

After deployment, verify:

1. **Main Application**: Visit `https://yourdomain.com/network/map.html`
2. **Assets Loading**: Check browser developer tools for 404 errors
3. **API Connectivity**: Verify sensor data is loading
4. **Mobile Responsiveness**: Test on different devices

### Common Issues

| Issue | Solution |
|-------|----------|
| 404 errors | Check file paths and permissions |
| Assets not loading | Verify directory structure |
| API CORS errors | Ensure proxy configuration is correct |
| Map not displaying | Check Mapbox token validity |

## 📊 Monitoring

### Error Tracking

Monitor for:
- JavaScript console errors
- Failed API requests
- Slow loading times
- Mobile compatibility issues

### Performance Optimization

- Enable gzip compression on your server
- Use CDN for static assets (optional)
- Monitor API response times
- Optimize image assets

## 🔒 Security

### File Permissions

Recommended permissions:
- HTML files: 644
- CSS files: 644
- JS files: 644
- Directories: 755

### API Security

- Monitor API usage
- Implement rate limiting if needed
- Secure sensitive configuration data

## 🔄 Update Process

### For cPanel Git Deployment

1. Make changes to your code
2. Test locally
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
4. cPanel will automatically deploy changes

### For Manual Deployment

1. Pull latest changes locally
2. Upload modified files via FTP/SFTP
3. Clear any server-side caches
4. Test the application

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Files not updating**
   - Clear browser cache
   - Check cPanel deployment logs
   - Verify file timestamps

2. **Permission errors**
   - Check file/directory permissions
   - Ensure cPanel user has write access

3. **Path issues**
   - Verify relative paths in HTML/CSS/JS
   - Check .cpanel.yml deployment paths

### Support Resources

- cPanel Documentation
- GitHub repository issues
- Hosting provider support
- Community forums

---

For additional support, contact the development team or refer to the main README.md file.
