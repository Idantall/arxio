'use client';

import { useState } from 'react';
import { Button } from 'ui';
import { useToast } from '@/hooks/use-toast';
import { fixAuthIssues } from '@/lib/user-utils';
import { Loader2 } from 'lucide-react';

interface AuthFixButtonProps {
  className?: string;
  email?: string;
  onSuccess?: (result: any) => void;
}

export function AuthFixButton({ 
  className, 
  email,
  onSuccess
}: AuthFixButtonProps) {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const handleFixAuth = async () => {
    if (isFixing) return;
    
    setIsFixing(true);
    try {
      const result = await fixAuthIssues(email);
      toast({
        title: "תיקון אימות הצליח",
        description: "פרטי המשתמש סונכרנו בהצלחה",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('שגיאה בתיקון אימות:', error);
      toast({
        title: "שגיאה בתיקון אימות",
        description: error instanceof Error ? error.message : "אירעה שגיאה בלתי צפויה",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      className={className}
      onClick={handleFixAuth}
      disabled={isFixing}
    >
      {isFixing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          מתקן אימות...
        </>
      ) : (
        'תקן בעיית אימות'
      )}
    </Button>
  );
} 