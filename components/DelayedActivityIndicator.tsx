import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

interface DelayedActivityIndicatorProps extends ActivityIndicatorProps {
    isLoading: boolean;
    delay?: number; 
}

const DelayedActivityIndicator: React.FC<DelayedActivityIndicatorProps> = ({ 
    isLoading, 
    delay = 300, 
    ...props 
}) => {
    const [showSpinner, setShowSpinner] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isLoading) {
            timer = setTimeout(() => setShowSpinner(true), delay);
        } else {
            setShowSpinner(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading, delay]);

    if (!showSpinner) return null;

    return <ActivityIndicator {...props} />;
};

export default DelayedActivityIndicator;