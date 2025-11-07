import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Fade,
  Avatar,
  IconButton,
} from "@mui/material";
import { AutoAwesome, Height, OpenInFull } from "@mui/icons-material";

interface CardData {
  id: number;
  title: string;
  height: number;
  isVisible: boolean;
  titleColor?: string | undefined;
}

export function Observers() {
  const [cards, setCards] = useState<CardData[]>(() => 
    Array.from({ length: 15 }, (_, index) => ({
      id: index,
      title: index === 0 ? "First Card" : index === 14 ? "Last Card" : `Card ${index + 1}`,
      isVisible: false,
      height: 200,
      titleColor: undefined,
    }))
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const lastCardRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, cardId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startY = e.clientY;
    const startHeight = cards.find(c => c.id === cardId)?.height || 200;
    let timeoutId: number | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(500, startHeight + deltaY));
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        setCards(prev => prev.map(c => 
          c.id === cardId ? { ...c, height: newHeight } : c
        ));
      }, 200);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const deltaY = e.clientY - startY;
      const finalHeight = Math.max(100, Math.min(500, startHeight + deltaY));
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, height: finalHeight } : c
      ));
      
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    setIsResizing(cardId);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [cards]);

  const handleTitleChange = useCallback((cardId: number, newTitle: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return { ...card, title: newTitle, titleColor: newTitle };
      }
      return card;
    }));
  }, []);

  const handleTitleSubmit = useCallback((cardId: number, newTitle: string) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return { ...card, title: newTitle, titleColor: newTitle };
      }
      return card;
    }));
    setEditingCard(null);
  }, []);

  useEffect(() => {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target as HTMLElement;
          
          let cardElement: HTMLElement | null = target;
          while (cardElement && cardElement.getAttribute && !cardElement.getAttribute('data-card-id')) {
            cardElement = cardElement.parentElement;
          }
          
          if (cardElement && cardElement.getAttribute) {
            const cardId = parseInt(cardElement.getAttribute('data-card-id') || '0');
            const titleElement = cardElement.querySelector('.card-title') as HTMLElement;
            
            if (titleElement) {
              const title = titleElement.textContent || '';
              setCards(prev => prev.map(card => 
                card.id === cardId ? { ...card, titleColor: title } : card
              ));
            }
          }
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [cards.length]);
  useEffect(() => {
    const cardElements = document.querySelectorAll(".mui-card");
    const lastCard = lastCardRef.current;
    
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = parseInt(entry.target.getAttribute("data-card-id") || "0");
          setCards(prev => prev.map(card => 
            card.id === cardId ? { ...card, isVisible: entry.isIntersecting } : card
          ));
        });
      },
      { threshold: 0.5 }
    );

    const loadNewCards = () => {
      const newCards: CardData[] = Array.from({ length: 10 }, (_, i) => ({
        id: cards.length + i,
        title: `New Card ${cards.length + i + 1}`,
        height: 200,
        isVisible: false,
        titleColor: undefined,
      }));
      
      setCards(prev => [...prev, ...newCards]);
    };

    const lastCardObserver = new IntersectionObserver(
      (entries) => {
        const lastCardFromList = entries[0];
        if (!lastCardFromList?.isIntersecting) return;
        loadNewCards();
        lastCardObserver.unobserve(lastCardFromList.target);
        if (lastCard) {
          lastCardObserver.observe(lastCard);
        }
      },
      { threshold: 0.1 }
    );

    cardElements.forEach((card) => {
      intersectionObserver.observe(card);
    });

    if (lastCard) {
      lastCardObserver.observe(lastCard);
    }

    return () => {
      intersectionObserver.disconnect();
      lastCardObserver.disconnect();
    };
  }, [cards.length]);

  useEffect(() => {
    const cardElements = document.querySelectorAll(".mui-card");
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const cardId = parseInt(entry.target.getAttribute("data-card-id") || "0");
        if (entry.contentRect.height > 150) {
          setCards(prev => prev.map(card => 
            card.id === cardId ? { ...card, height: entry.contentRect.height } : card
          ));
        }
      });
    });

    cardElements.forEach((card) => {
      resizeObserver.observe(card);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [cards]);


  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        {cards.map((card, index) => (
          <Fade
            key={card.id}
            in={card.isVisible}
            timeout={600}
            style={{ width: "100%" }}
          >
            <Box
              sx={{
                position: "relative",
                width: 600,
                height: card.height,
                margin: "0 auto",
                maxWidth: "100%",
              }}
            >
              <Card
                className={`mui-card ${isResizing === card.id ? 'card-resizing' : ''}`}
                data-card-id={card.id}
                ref={index === cards.length - 1 ? lastCardRef : null}
                sx={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.3)",
                  transform: "translateY(0)",
                  transition: "none",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        mr: 2,
                        width: 40,
                        height: 40,
                      }}
                    >
                      <AutoAwesome />
                    </Avatar>
                    {editingCard === card.id ? (
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleTitleChange(card.id, e.target.value)}
                        onBlur={(e) => handleTitleSubmit(card.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleSubmit(card.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingCard(null);
                          }
                        }}
                        className="card-title"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: card.titleColor || 'white',
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          flex: 1,
                          outline: 'none',
                          borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                          padding: '4px 0',
                        }}
                        autoFocus
                      />
                    ) : (
                      <Typography 
                        variant="h6" 
                        component="h2" 
                        className="card-title"
                        onClick={() => setEditingCard(card.id)}
                        sx={{ 
                          fontWeight: 600, 
                          flex: 1,
                          color: card.titleColor || 'white',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        {card.title}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                  }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: "bold",
                        textAlign: "center",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {Math.round(card.height)}px
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    mt: "auto",
                    pt: 1,
                    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
                  }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Drag the corner to resize
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              
              <Box
                onMouseDown={(e) => handleMouseDown(e, card.id)}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 20,
                  height: 20,
                  background: "rgba(255, 255, 255, 0.4)",
                  borderRadius: "4px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "nw-resize",
                  zIndex: 10,
                }}
              >
                <OpenInFull sx={{ 
                  fontSize: 14, 
                  color: "white",
                  transform: "rotate(45deg)",
                }} />
              </Box>
            </Box>
          </Fade>
        ))}
      </Box>
    </Container>
  );
}

