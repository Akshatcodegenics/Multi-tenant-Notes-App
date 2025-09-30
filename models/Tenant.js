const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  subscription: {
    type: String,
    enum: ['FREE', 'PRO'],
    default: 'FREE'
  },
  noteLimit: {
    type: Number,
    default: function() {
      return this.subscription === 'FREE' ? 3 : -1; // -1 for unlimited
    }
  }
}, {
  timestamps: true
});

// Virtual to check if tenant has reached note limit
tenantSchema.virtual('hasReachedNoteLimit').get(function() {
  return this.subscription === 'FREE' && this.noteLimit <= 0;
});

// Method to upgrade subscription
tenantSchema.methods.upgradeToPro = function() {
  this.subscription = 'PRO';
  this.noteLimit = -1; // Unlimited
  return this.save();
};

// Method to check if can create note
tenantSchema.methods.canCreateNote = async function() {
  if (this.subscription === 'PRO') return true;
  
  const Note = mongoose.model('Note');
  const noteCount = await Note.countDocuments({ tenantId: this._id });
  return noteCount < 3;
};

module.exports = mongoose.model('Tenant', tenantSchema);