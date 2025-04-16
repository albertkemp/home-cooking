'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define the type for user data used in the form
type UserSettings = {
    email: string;
    name: string;
    role: 'COOK' | 'EATER';
    address: string;
    bio?: string | null;
};

export default function AccountSettingsPage() {
    const { data: session, status, update: updateSession } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState<UserSettings>({ email: '', name: '', role: 'EATER', address: '', bio: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch user data on load
    useEffect(() => {
        if (status === 'authenticated') {
            setLoading(true);
            fetch('/api/account')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch account data');
                    return res.json();
                })
                .then(data => {
                    setFormData({
                        email: data.email,
                        name: data.name,
                        role: data.role,
                        address: data.address,
                        bio: data.bio || '',
                    });
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    // Handle profile update
    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        const payload: any = { ...formData };
        // Only include passwords if newPassword is set
        if (passwordData.newPassword) {
            payload.currentPassword = passwordData.currentPassword;
            payload.newPassword = passwordData.newPassword;
        }

        try {
            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update profile');
            
            setSuccess('Profile updated successfully!');
            setFormData({ // Update local form state with returned data
                 email: data.email,
                 name: data.name,
                 role: data.role,
                 address: data.address,
                 bio: data.bio || '',
            });
            setPasswordData({ currentPassword: '', newPassword: '' }); // Clear password fields
            // Trigger session update if role changed, etc.
            await updateSession(); 

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle account deletion
    const handleDeleteAccount = async () => {
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch('/api/account', { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete account');
            
            // Deletion successful (even if mocked), sign out and redirect
            console.log("Account deletion API call successful (may be mocked)");
            await signOut({ callbackUrl: '/', redirect: true });
             // No need to set success message as we're redirecting

        } catch (err: any) {
            setError(err.message);
            setIsDeleting(false);
        }
        // No finally block needed for isDeleting here due to redirect/signout
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
     if (status !== 'authenticated') {
        // Shouldn't reach here if redirect works, but as a fallback
        return null; 
    }

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">Error: {error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded">{success}</div>}

            {/* Profile Information Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white p-6 rounded-lg shadow-md mb-10">
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                
                {/* Non-editable Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        disabled // Email is typically not changeable
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed sm:text-sm"
                    />
                </div>

                {/* Editable Fields */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Account Type</label>
                    <select id="role" name="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option value="EATER">Eater</option>
                        <option value="COOK">Cook</option>
                    </select>
                </div>
                {formData.role === 'COOK' && (
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Cook Bio</label>
                        <textarea id="bio" name="bio" rows={3} value={formData.bio || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Tell customers about your cooking!"></textarea>
                    </div>
                )}
                
                <hr className="my-6"/>

                {/* Password Change Section */}
                <h3 className="text-lg font-medium text-gray-800">Change Password (Optional)</h3>
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input type="password" id="currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Required to set new password" />
                </div>
                 <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Leave blank to keep current password" />
                </div>

                {/* Submit Button */}
                <div className="text-right">
                    <button
                        type="submit"
                        disabled={isUpdating}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

            {/* Delete Account Section */}
            <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
                 <h2 className="text-xl font-semibold text-red-800 mb-4">Delete Account</h2>
                 <p className="text-sm text-red-700 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                 <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                 >
                     {isDeleting ? 'Deleting...' : 'Delete My Account Permanently'}
                 </button>
            </div>
        </div>
    );
} 