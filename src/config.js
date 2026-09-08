import dotenv from 'dotenv';
dotenv.config();

export const config = {
  profileUrl: process.env.CRICBUZZ_URL || 'https://www.cricbuzz.com/profiles/1413/virat-kohli',
  email: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_PASS || '',
    to: process.env.TO_EMAIL || 'reach.high1234@gmail.com',
  },
  forceEmailOnNoChange: process.env.FORCE_EMAIL === 'true'
};
