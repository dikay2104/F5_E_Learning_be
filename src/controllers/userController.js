const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Lấy thông tin user hiện tại (dựa vào token)
exports.getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

//cập nhật thông tin user
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword, avatar } = req.body;
    const userId = req.user.id;

    // tìm user theo id
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    //kiểm tra email mới co bị trùng không(nếu có đổi mail)
    if (email && email !== user.email) {
      const existingUser = await User.findOne( { email} );
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use ' });
      }
    }
    
    //cập nhật thông tin cơ bản
    const updateData = {};
    if(fullName) updateData.fullName = fullName;
    if(email) updateData.email = email;
    if(avatar !== undefined && avatar !== null && avatar !== '') updateData.avatar = avatar;

    //đổi mật khẩu
    if(newPassword) {
      if(!currentPassword) {
        return res.status(400).json({ message: 'Current password is required'});
      }
      
      // Kiểm tra mật khẩu hiện tại
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      //hash mật khẩu mới
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    
    //cập nhật user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
    
    // Tạo token mới để duy trì đăng nhập
    const newToken = jwt.sign(
      { id: updatedUser._id, role: updatedUser.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '2d' }
    );
    
    res.json({
      message: 'User profile updated successfully',
      user: updatedUser,
      token: newToken, // Trả về token mới
      passwordChanged: !!newPassword // Flag để frontend biết có đổi mật khẩu không
    });

  } catch (err) {
    res.status(500).json({ message: 'Error updating user profile', error: err.message });
  }
};

// Lấy danh sách tất cả user (phân trang, tìm kiếm, lọc)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role, isActive } = req.query;
    const query = {};

    // Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    // Lọc theo role
    if (role) {
      query.role = role;
    }
    // Lọc theo trạng thái hoạt động
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

// Ban user - chỉ admin
exports.banUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Không cho phép admin tự ban chính mình
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'Bạn không thể tự ban chính mình!' });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, isBanned: true },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User đã bị ban thành công', user });
  } catch (err) {
    res.status(500).json({ message: 'Ban user failed', error: err.message });
  }
};

// Unban user - chỉ admin
exports.unbanUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive:   true, isBanned: false }, 
      { new: true } 
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User đã được mở khóa thành công', user });
  } catch (err) {
    res.status(500).json({ message: 'Unban user failed', error: err.message });
  }
};