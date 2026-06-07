// src/contexts/RepositoryContext.tsx
import React, { createContext, useContext, useMemo } from "react";
import { Platform } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

// Interfaces
import { IUserRepository } from "../database/repositories/interfaces/IUserRepository";
import { IAscentRepository } from "../database/repositories/interfaces/IAscentRepository";
import { IRouteRepository } from "../database/repositories/interfaces/IRouteRepository";

// Implementations
import { WebUserRepository } from "../database/repositories/web/UserRepository";
import { WebAscentRepository } from "../database/repositories/web/AscentRepository";
import { WebRouteRepository } from "../database/repositories/web/RouteRepository";

import { MobileUserRepository } from "../database/repositories/mobile/UserRepository";
import { MobileAscentRepository } from "../database/repositories/mobile/AscentRepository";
import { MobileRouteRepository } from "../database/repositories/mobile/RouteRepository";


interface RepositoryContextType {
    userRepository: IUserRepository;
	ascentRepository: IAscentRepository
	routeRepository: IRouteRepository

}

const RepositoryContext = createContext<RepositoryContextType | null>(null);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let db: any = null;
    
    if (Platform.OS !== 'web') {
        try {
            db = useSQLiteContext();
        } catch (e) {
            console.warn("SQLite nie jest jeszcze gotowe", e);
        }
    }

    const repositories = useMemo(() => {
        if (Platform.OS === 'web') {
            return {
                userRepository: new WebUserRepository(),
				ascentRepository: new WebAscentRepository(),
				routeRepository: new WebRouteRepository(),
            };
        } else {
            return {
                userRepository: new MobileUserRepository(db),
                ascentRepository: new  MobileAscentRepository(db),
                routeRepository: new  MobileRouteRepository(db),
            };
        }
    }, [db]);

    return (
        <RepositoryContext.Provider value={repositories}>
            {children}
        </RepositoryContext.Provider>
    );
};

export const useRepositories = () => {
    const context = useContext(RepositoryContext);
    if (!context) {
        throw new Error("useRepositories must be used within a RepositoryProvider");
    }
    return context;
};