const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Find the user by email
      const user = await User.findOne({ email });
      
      // If user doesn't exist
      if (!user) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      // Check if the password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password' });
      }
      
      // Return the user if credentials are valid
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with the same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }
      
      // Create a new user
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        avatar: profile.photos[0].value,
        emailVerified: true // Google accounts have verified emails
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }
));

// GitHub Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/github/callback`,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ githubId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Get email (GitHub may not provide email in profile)
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (email) {
        // Check if user exists with the same email
        user = await User.findOne({ email });
        
        if (user) {
          // Update existing user with GitHub ID
          user.githubId = profile.id;
          await user.save();
          return done(null, user);
        }
      }
      
      // Create a new user
      const newUser = new User({
        name: profile.displayName || profile.username,
        email: email,
        githubId: profile.id,
        avatar: profile.photos[0].value,
        emailVerified: true // GitHub accounts have verified emails
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }
));

// Microsoft Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`,
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ microsoftId: profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with the same email
      const email = profile.emails[0].value;
      user = await User.findOne({ email });
      
      if (user) {
        // Update existing user with Microsoft ID
        user.microsoftId = profile.id;
        await user.save();
        return done(null, user);
      }
      
      // Create a new user
      const newUser = new User({
        name: profile.displayName,
        email: email,
        microsoftId: profile.id,
        emailVerified: true // Microsoft accounts have verified emails
      });
      
      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error);
    }
  }
)); 