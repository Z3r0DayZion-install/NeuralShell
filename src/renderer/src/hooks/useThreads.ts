import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThreadReply = {
    id: string;
    content: string;
    createdAt: string;
};

type ThreadRecord = {
    id: string;
    messageId: string;
    rootContent: string;
    createdAt: string;
    replies: ThreadReply[];
};

function makeId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ThreadStore = {
    threadsBySession: Record<string, Record<string, ThreadRecord>>;
    activeThreadIdBySession: Record<string, string>;
    startThread: (sessionId: string, messageId: string, rootContent: string) => string;
    openThread: (sessionId: string, threadId: string) => void;
    closeThread: (sessionId: string) => void;
    addReply: (sessionId: string, threadId: string, content: string) => boolean;
};

const EMPTY_THREADS: Record<string, ThreadRecord> = Object.freeze({}) as Record<string, ThreadRecord>;

const useThreadStore = create<ThreadStore>()(
    persist(
        (set, get) => ({
            threadsBySession: {},
            activeThreadIdBySession: {},
            startThread: (sessionId, messageId, rootContent) => {
                const safeSessionId = String(sessionId || 'default');
                const safeMessageId = String(messageId || '').trim();
                const currentThreads = get().threadsBySession[safeSessionId] || {};
                const existing = Object.values(currentThreads).find((item) => String(item.messageId || '') === safeMessageId);
                if (existing) {
                    set((state) => ({
                        activeThreadIdBySession: {
                            ...state.activeThreadIdBySession,
                            [safeSessionId]: existing.id,
                        },
                    }));
                    return existing.id;
                }

                const threadId = makeId(String(messageId || 'msg'));
                const thread: ThreadRecord = {
                    id: threadId,
                    messageId: safeMessageId,
                    rootContent: String(rootContent || ''),
                    createdAt: new Date().toISOString(),
                    replies: [],
                };

                set((state) => ({
                    threadsBySession: {
                        ...state.threadsBySession,
                        [safeSessionId]: {
                            ...(state.threadsBySession[safeSessionId] || {}),
                            [threadId]: thread,
                        },
                    },
                    activeThreadIdBySession: {
                        ...state.activeThreadIdBySession,
                        [safeSessionId]: threadId,
                    },
                }));
                return threadId;
            },
            openThread: (sessionId, threadId) => {
                const safeSessionId = String(sessionId || 'default');
                set((state) => ({
                    activeThreadIdBySession: {
                        ...state.activeThreadIdBySession,
                        [safeSessionId]: String(threadId || ''),
                    },
                }));
            },
            closeThread: (sessionId) => {
                const safeSessionId = String(sessionId || 'default');
                set((state) => ({
                    activeThreadIdBySession: {
                        ...state.activeThreadIdBySession,
                        [safeSessionId]: '',
                    },
                }));
            },
            addReply: (sessionId, threadId, content) => {
                const safeSessionId = String(sessionId || 'default');
                const safeThreadId = String(threadId || '').trim();
                const safeContent = String(content || '').trim();
                if (!safeThreadId || !safeContent) return false;

                const current = get().threadsBySession[safeSessionId] || {};
                const target = current[safeThreadId];
                if (!target) return false;

                const nextReply: ThreadReply = {
                    id: makeId('reply'),
                    content: safeContent,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    threadsBySession: {
                        ...state.threadsBySession,
                        [safeSessionId]: {
                            ...(state.threadsBySession[safeSessionId] || {}),
                            [safeThreadId]: {
                                ...target,
                                replies: [...target.replies, nextReply],
                            },
                        },
                    },
                }));
                return true;
            },
        }),
        {
            name: 'neuralshell-thread-store-v1',
            storage: createJSONStorage(() => window.localStorage),
            partialize: (state) => ({
                threadsBySession: state.threadsBySession,
                activeThreadIdBySession: state.activeThreadIdBySession,
            }),
        },
    ),
);

export function useThreads(sessionId: string) {
    const safeSessionId = String(sessionId || 'default');
    const threads = useThreadStore((state) => state.threadsBySession[safeSessionId] || EMPTY_THREADS);
    const activeThreadId = useThreadStore((state) => state.activeThreadIdBySession[safeSessionId] || '');
    const startThreadState = useThreadStore((state) => state.startThread);
    const openThreadState = useThreadStore((state) => state.openThread);
    const closeThreadState = useThreadStore((state) => state.closeThread);
    const addReplyState = useThreadStore((state) => state.addReply);

    const startThread = React.useCallback((messageId: string, rootContent: string) => {
        return startThreadState(safeSessionId, messageId, rootContent);
    }, [safeSessionId, startThreadState]);

    const openThread = React.useCallback((threadId: string) => {
        openThreadState(safeSessionId, threadId);
    }, [openThreadState, safeSessionId]);

    const closeThread = React.useCallback(() => {
        closeThreadState(safeSessionId);
    }, [closeThreadState, safeSessionId]);

    const addReply = React.useCallback((threadId: string, content: string) => {
        return addReplyState(safeSessionId, threadId, content);
    }, [addReplyState, safeSessionId]);

    const activeThread = activeThreadId ? (threads[activeThreadId] || null) : null;
    const list = React.useMemo(() => {
        return Object.values(threads).sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [threads]);

    return {
        threads,
        list,
        activeThreadId,
        activeThread,
        startThread,
        openThread,
        closeThread,
        addReply,
    };
}

export default useThreads;
