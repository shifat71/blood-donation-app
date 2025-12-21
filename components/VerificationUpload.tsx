'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

type VerificationUploadProps = {
  onSuccess?: () => void;
};

export default function VerificationUpload({ onSuccess }: VerificationUploadProps) {
  const [studentId, setStudentId] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setIdCardFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!idCardFile) {
      setError('Please upload your student ID card');
      setLoading(false);
      return;
    }

    try {
      // Convert file to base64 for API upload
      const reader = new FileReader();
      reader.readAsDataURL(idCardFile);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        // API will handle Cloudinary upload
        const response = await fetch('/api/verification/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId,
            idCardImageUrl: base64Image,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to submit verification request');
        } else {
          setSuccess(true);
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        }
        setLoading(false);
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Verification Request Submitted!
        </h3>
        <p className="text-sm text-green-700">
          Your request is being reviewed by a moderator. You&apos;ll be notified once it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Clock className="h-6 w-6 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Account Verification Required
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Your account needs to be verified before you can become a blood donor. Please upload your student ID card for manual verification.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
            Student ID
          </label>
          <input
            id="studentId"
            type="text"
            required
            className="input-field"
            placeholder="2021XXXXXXX"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="idCard" className="block text-sm font-medium text-gray-700 mb-1">
            Student ID Card Image *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-red-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="idCard"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="idCard"
                    name="idCard"
                    type="file"
                    accept="image/*"
                    required
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
              {idCardFile && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  ✓ {idCardFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-sm sm:text-base"
        >
          {loading ? 'Submitting...' : 'Submit Verification Request'}
        </button>
      </form>
    </div>
  );
}
