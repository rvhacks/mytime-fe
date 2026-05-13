import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Camera,
  Shield,
  Cake,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import toast, { Toaster } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuthStore();
  const [avatarHover, setAvatarHover] = useState(false);

  if (!user) return null;

  const profileFields = [
    { label: 'Full Name', value: user.name, icon: User },
    { label: 'Email Address', value: user.email, icon: Mail },
    { label: 'Phone Number', value: user.phone || '—', icon: Phone },
    { label: 'Designation', value: user.designation || '—', icon: Briefcase },
    { label: 'Date of Birth', value: user.dob ? new Date(user.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: Cake },
    { label: 'Join Date', value: user.joinDate ? new Date(user.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: Calendar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <Toaster position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          View and manage your profile information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div
              className="relative cursor-pointer group"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              <Avatar name={user.name} size="xl" className="w-24 h-24 text-2xl" />
              <motion.div
                initial={false}
                animate={{ opacity: avatarHover ? 1 : 0 }}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </motion.div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{user.name}</h2>
              <p className="text-[var(--text-secondary)] mt-0.5">{user.designation}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant="default">
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {profileFields.map((field, i) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <field.icon className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    {field.label}
                  </label>
                </div>
                <p className="text-sm text-[var(--text-primary)] pl-6 font-medium">{field.value}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
