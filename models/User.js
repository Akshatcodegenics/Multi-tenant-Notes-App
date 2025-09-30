const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MEMBER'],
    default: 'MEMBER'
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure email is unique per tenant
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'ADMIN';
};

// Method to check if user belongs to tenant
userSchema.methods.belongsToTenant = function(tenantId) {
  return this.tenantId.toString() === tenantId.toString();
};

// Populate tenant information
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);