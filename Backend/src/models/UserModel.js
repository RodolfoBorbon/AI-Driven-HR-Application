import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String, 
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['IT Admin', 'HR Manager', 'HR Assistant'],
      default: 'HR Assistant',
    },
  },
  { timestamps: true }
);

// Check if a default admin exists, if not create one
userSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ role: 'IT Admin' });
    
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123456', salt);
      
      await this.create({
        username: 'IT Admin',
        email: 'admin@exera.com',
        password: hashedPassword,
        role: 'IT Admin'
      });
      
      console.log('✅ Default admin account created');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

const User = mongoose.model('User', userSchema);

export default User;
