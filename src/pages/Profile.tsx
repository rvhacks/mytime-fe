import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Camera,
  Shield,
  Cake,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  Edit3,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { useManagementStore } from '@/store/managementStore';
import { userAPI } from '@/services/api';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import toast, { Toaster } from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Canvas crop helper
// ---------------------------------------------------------------------------

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Force square output at 256px
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [avatarHover, setAvatarHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', mobile: '', dob: '', designationId: '',
  });
  const { designations, fetchDesignations } = useManagementStore();
  const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const buildAvatarUrl = (url: string | null | undefined) => {
    if (!url || url.trim() === '') return null;
    // Already a full URL
    if (url.startsWith('http')) return url;
    // Absolute filesystem path — extract just the filename
    if (url.startsWith('/Users/') || url.startsWith('/home/') || url.includes(':\\')) {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      return `${API_HOST}/uploads/avatars/${filename}`;
    }
    // Relative URL like /uploads/avatars/xxx.jpg
    if (url.startsWith('/')) return `${API_HOST}${url}`;
    // Raw filename like uuid_hash.jpg (no path prefix)
    return `${API_HOST}/uploads/avatars/${url}`;
  };
  const [avatarUrl, setAvatarUrl] = useState<string | null>(buildAvatarUrl(user?.avatar));

  // Fetch fresh profile from API on mount to get correct avatarUrl
  useEffect(() => {
    userAPI.getProfile().then((res) => {
      const data = res.data.data;
      const freshUrl = data?.avatarUrl || data?.avatar_path || '';
      if (freshUrl) {
        setAvatarUrl(buildAvatarUrl(freshUrl));
        if (user) setUser({ ...user, avatar: data.avatarUrl || freshUrl });
      }
    }).catch(() => { /* ignore */ });
    fetchDesignations({ limit: 100 });
  }, []);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropModalOpen(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const res = await userAPI.uploadAvatar(file);
      const url = res.data.data?.avatarUrl;
      if (url) {
        const fullUrl = buildAvatarUrl(url);
        setAvatarUrl(fullUrl);
        // Update auth store so sidebar/header reflect new avatar
        if (user) setUser({ ...user, avatar: url });
      }
      toast.success('Profile photo updated!');
      setCropModalOpen(false);
      setImageSrc(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed. S3 may not be configured.');
    }
    setIsUploading(false);
  };

  if (!user) return null;

  const startEditing = () => {
    const nameParts = (user.name || '').split(' ');
    setEditForm({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      mobile: user.phone || '',
      dob: user.dob || '',
      designationId: '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await userAPI.updateProfile({
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        mobile: editForm.mobile.trim(),
        dob: editForm.dob,
        designationId: editForm.designationId || undefined,
      });
      // Refresh user data
      const res = await userAPI.getProfile();
      const data = res.data.data;
      if (data && user) {
        setUser({
          ...user,
          name: `${data.first_name || data.firstName || ''} ${data.last_name || data.lastName || ''}`.trim(),
          phone: data.mobile || data.phone || '',
          dob: data.dob || '',
          designation: data.designation?.name || user.designation,
        });
      }
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setIsSaving(false);
  };

  const profileFields = [
    { label: 'Full Name', value: user.name, icon: UserIcon },
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

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
            {/* Avatar with upload trigger */}
            <div
              className="relative cursor-pointer group"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[var(--card-border)]" />
              ) : (
                <Avatar name={user.name} size="xl" className="w-24 h-24 text-2xl" />
              )}
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Personal Information</CardTitle>
            {!isEditing ? (
              <Button size="sm" variant="outline" onClick={startEditing}>
                <Edit3 className="w-4 h-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button size="sm" onClick={handleSaveProfile} isLoading={isSaving}>
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input type="tel" value={editForm.mobile} onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div>
                <Label>Designation</Label>
                <select
                  value={editForm.designationId}
                  onChange={(e) => setEditForm(f => ({ ...f, designationId: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Keep current</option>
                  {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={editForm.dob} onChange={(e) => setEditForm(f => ({ ...f, dob: e.target.value }))} />
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* ---- CROP MODAL ---- */}
      <AnimatePresence>
        {cropModalOpen && imageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !isUploading && setCropModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Crop Photo</h3>
                <button
                  onClick={() => !isUploading && setCropModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cropper Area */}
              <div className="relative w-full h-80 bg-black">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-4 px-6 py-3 border-t border-[var(--border-secondary)]">
                <ZoomOut className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-brand-500"
                />
                <ZoomIn className="w-4 h-4 text-[var(--text-tertiary)]" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)]">
                <Button
                  variant="outline"
                  onClick={() => setCropModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-brand-500 hover:bg-brand-600 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading…
                    </>
                  ) : (
                    'Save Photo'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
