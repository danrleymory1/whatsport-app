# Implementação do TomTom Maps API

Este documento explica como a integração do TomTom Maps API foi implementada nesta aplicação.

## Estrutura de Arquivos

1. `/src/components/map/tomtom-map.tsx` - Componente React para exibição do mapa
2. `/src/types/tomtom.d.ts` - Definições de tipos TypeScript para o TomTom SDK
3. `/src/services/map-service.ts` - Serviço para gerenciar operações do mapa e geocodificação
4. `/public/icons/event-marker.svg` - Ícone SVG para marcadores de eventos

## Configuração Inicial

### 1. Configuração da Chave API

Adicione sua chave API do TomTom ao arquivo `.env.local`:

```
NEXT_PUBLIC_TOMTOM_KEY=sua_chave_api_aqui
```

### 2. Carregamento do SDK

O SDK do TomTom é carregado dinamicamente no componente `TomTomMap` usando a técnica de carregamento de script assíncrono. Isso é feito no hook `useEffect` que carrega os scripts CSS e JavaScript necessários.

## Componente TomTomMap

O componente `TomTomMap` foi projetado para:

1. Carregar dinamicamente o SDK do TomTom
2. Inicializar o mapa com opções configuráveis
3. Exibir marcadores para eventos
4. Fornecer controles de UI para zoom e localização
5. Permitir interatividade com os eventos exibidos

### Props do Componente

```typescript
interface MapProps {
  apiKey: string;                                    // Chave API do TomTom
  events?: Event[];                                  // Lista de eventos para exibir no mapa
  onMarkerClick?: (event: Event) => void;            // Callback quando um marcador é clicado
  initialCenter?: { lat: number; lng: number };      // Centro inicial do mapa
  initialZoom?: number;                              // Nível de zoom inicial
  height?: string;                                   // Altura do mapa
}
```

## Serviço de Mapa

O serviço `mapService` fornece funcionalidades para:

1. Carregar o SDK do TomTom
2. Criar instâncias de mapa
3. Geocodificação (busca de endereços)
4. Geocodificação reversa (obter endereço a partir de coordenadas)
5. Cálculo de distância entre pontos
6. Obtenção da localização atual do usuário

## Tipagem TypeScript

O arquivo `tomtom.d.ts` fornece interfaces TypeScript para o SDK do TomTom, garantindo que o código tenha tipagem forte e autocompletar no IDE.

## Exemplo de Uso

```tsx
import TomTomMap from '@/components/map/tomtom-map';
import { mapService } from '@/services/map-service';
import { useState, useEffect } from 'react';

export default function MapPage() {
  const [userLocation, setUserLocation] = useState(null);
  
  useEffect(() => {
    // Obter localização do usuário
    mapService.getCurrentPosition().then(position => {
      if (position) {
        setUserLocation(position);
      }
    });
  }, []);
  
  return (
    <div style={{ height: "500px" }}>
      <TomTomMap
        apiKey={process.env.NEXT_PUBLIC_TOMTOM_KEY || ""}
        initialCenter={userLocation}
        initialZoom={13}
        events={[]}
        onMarkerClick={(event) => console.log('Evento clicado:', event)}
      />
    </div>
  );
}
```

## Recursos Adicionais

- Se precisar adicionar funcionalidades como roteamento ou tráfego, consulte a [documentação oficial do TomTom](https://developer.tomtom.com/maps-sdk-web-js).
- Para personalizar os marcadores, modifique o arquivo SVG em `/public/icons/event-marker.svg`.
- Para ajustar o estilo do mapa, use a opção `style` ao criar o mapa (ex: 'main', 'night', etc).

## Solução de Problemas

1. **Mapa não carrega**: Verifique se a chave API está correta e se os scripts estão sendo carregados (verifique o console do navegador).
2. **Marcadores não aparecem**: Certifique-se de que os eventos tenham coordenadas válidas (lat/lng).
3. **Erro de TypeScript**: Se encontrar erros de tipo, verifique se as interfaces no arquivo `tomtom.d.ts` estão atualizadas conforme a versão do SDK que você está usando.