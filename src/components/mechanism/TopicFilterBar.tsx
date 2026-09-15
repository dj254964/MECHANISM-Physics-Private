import React, { useState } from 'react';
import { BookOpen, Plus, Check, X, Search } from 'lucide-react';
import { Topic } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface TopicFilterBarProps {
  topics: Topic[];
  selectedTopicId?: string;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic?: (name: string, description: string) => Promise<void> | void;
  className?: string;
  compact?: boolean;
}

export const TopicFilterBar: React.FC<TopicFilterBarProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onCreateTopic,
  className = '',
  compact = false,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = searchQuery
    ? topics.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.chapter && t.chapter.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : topics;

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !onCreateTopic) return;

    try {
      setIsSubmitting(true);
      await onCreateTopic(newTopicName.trim(), 'Custom physics inquiry topic');
      setNewTopicName('');
      setShowCreateForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Target Physics Mechanism:
          </span>
        </div>

        {onCreateTopic && !showCreateForm && (
          <Button
            size="xs"
            variant="ghost"
            icon={Plus}
            onClick={() => setShowCreateForm(true)}
          >
            Custom Topic
          </Button>
        )}
      </div>

      {showCreateForm ? (
        <form onSubmit={handleCreateTopic} className="p-3 rounded-lg border border-blue-300 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 flex items-center gap-2">
          <Input
            autoFocus
            placeholder="E.g., Quantum Harmonic Oscillator Ladder Operators"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="text-xs py-1.5"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            icon={Check}
            loading={isSubmitting}
            disabled={!newTopicName.trim()}
          >
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            icon={X}
            onClick={() => setShowCreateForm(false)}
          />
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          {!compact && topics.length > 8 && (
            <div className="w-full sm:w-48">
              <Input
                icon={Search}
                placeholder="Filter topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>
          )}

          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {filteredTopics.map((topic) => {
              const isSelected = topic.id === selectedTopicId;

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onSelectTopic(topic.id)}
                  className={`
                    px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-all duration-150
                    ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-600 text-white font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151c2e] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }
                  `.trim()}
                >
                  {topic.name}
                  {topic.is_custom && (
                    <span className="ml-1.5 opacity-60 text-[10px] uppercase font-mono">Custom</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
