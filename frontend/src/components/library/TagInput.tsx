import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  existingItems?: Array<{ id: number; name: string }>; // Reserved for future auto-suggest feature
  allowDuplicates?: boolean;
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = "Type and press Enter (or use commas) to add. Suggestions will appear as you type.",
  existingItems: _existingItems = [], // Reserved for future auto-suggest feature
  allowDuplicates = false,
  onTagAdd,
  onTagRemove,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');

  const isDuplicate = (tag: string): boolean => {
    if (allowDuplicates) return false;
    const tagLower = tag.trim().toLowerCase();
    return tags.some(t => t.trim().toLowerCase() === tagLower);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Check for duplicates
    if (isDuplicate(trimmedTag)) {
      return; // Silently prevent duplicate
    }

    const newTags = [...tags, trimmedTag];
    onChange(newTags);
    onTagAdd?.(trimmedTag);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    const removedTag = tags[index];
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
    onTagRemove?.(removedTag);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Handle comma-separated values
    if (value.includes(',')) {
      const parts = value.split(',').map(part => part.trim()).filter(part => part);
      parts.forEach(part => {
        if (part && !isDuplicate(part)) {
          addTag(part);
        }
      });
      setInputValue('');
    } else {
      setInputValue(value);
    }
  };

  const handleClearAll = () => {
    tags.forEach((_, index) => {
      onTagRemove?.(tags[index]);
    });
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white min-h-[48px]">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        />
      </div>
      {tags.length > 0 && !disabled && (
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default TagInput;

