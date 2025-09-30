const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient tenant-based queries
noteSchema.index({ tenantId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, createdAt: -1 });

// Method to check if user can access this note
noteSchema.methods.canAccess = function(userId, tenantId) {
  return this.tenantId.toString() === tenantId.toString() && 
         (this.userId.toString() === userId.toString() || this.isAdmin);
};

// Static method to find notes by tenant
noteSchema.statics.findByTenant = function(tenantId, options = {}) {
  const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
  
  return this.find({ tenantId })
    .populate('userId', 'email role')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Static method to count notes by tenant
noteSchema.statics.countByTenant = function(tenantId) {
  return this.countDocuments({ tenantId });
};

module.exports = mongoose.model('Note', noteSchema);