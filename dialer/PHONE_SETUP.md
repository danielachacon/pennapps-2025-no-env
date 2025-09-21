# Phone Calling Setup Guide

This guide will help you set up phone calling functionality using Twilio.

## 1. Create a Twilio Account

1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for a free account
3. Verify your phone number

## 2. Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Purchase a phone number:
   - Go to Phone Numbers → Manage → Buy a number
   - Choose a number with voice capabilities
   - Note down the phone number (format: +1234567890)

## 3. Configure Environment Variables

Create a `.env` file in the `backend` directory with your Twilio credentials:

```bash
# In backend/.env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## 4. Install Python-dotenv (Optional)

For automatic environment variable loading:

```bash
cd backend
source venv/bin/activate
pip install python-dotenv
```

Then add this to the top of `main.py`:
```python
from dotenv import load_dotenv
load_dotenv()
```

## 5. Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Go to `http://localhost:3000`
4. Use the phone calling form to test

## 6. API Endpoints

- `POST /call` - Make a phone call
- `GET /call/status/{call_sid}` - Check call status
- `POST /call/webhook` - Webhook for call updates

## 7. Troubleshooting

### Common Issues:

1. **"Twilio not configured" error**
   - Make sure your environment variables are set correctly
   - Restart the backend server after setting environment variables

2. **"Failed to make call" error**
   - Check that your Twilio phone number is correct
   - Ensure the target phone number is in the correct format (+1234567890)
   - Verify your Twilio account has sufficient credits

3. **Call not connecting**
   - Check that the target phone number is valid
   - Ensure your Twilio account is verified for the target country

## 8. Free Trial Limitations

- Twilio free trial accounts can only call verified phone numbers
- You need to verify the phone number you want to call in your Twilio console
- Free trial has limited credits

## 9. Production Considerations

- Use environment variables for all sensitive data
- Implement proper error handling
- Add rate limiting for call endpoints
- Consider call logging and monitoring
- Set up proper webhook security