import React, {useState, useEffect} from 'react';
import {View, Button, Text} from 'react-native';
import axios from 'axios';
import Sound from 'react-native-sound';
import {writeFile} from 'react-native-fs';
import RNFS from 'react-native-fs';
import base64js from 'base64-js';
import TrackPlayer from 'react-native-track-player';

const Whisper = () => {
  useEffect(() => {
    const setupPlayer = async () => {
      await TrackPlayer.setupPlayer();
      TrackPlayer.registerPlaybackService(() => require('./player-service.js'));
    };

    setupPlayer();

    return () => {
      TrackPlayer.destroy();
    };
  }, []);
  const [isLoading, setIsLoading] = useState(false);

  const generateSpeech = async text => {
    setIsLoading(true);

    const textData =
      "कथासार 'गोदान' केंद्रीय पात्र होरी के इर्द-गिर्द घूमती है, जो एक गरीब किसान है। उसकी सबसे बड़ी आकांक्षा एक गाय खरीदने की है। उसके लिए गाय समृद्धि, सामाजिक प्रतिष्ठा और पूजनीयता का प्रतीक है। होरी अपने इस सपने को साकार करने के लिए बहुत ऋण लेता है, और यह ऋण धीरे-धीरे उसे और उसके परिवार को निगलने लगता है।";

    const sentences = textData.split('। ');

    for (const sentence of sentences) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/audio/speech',
          {
            model: 'tts-1',
            input: sentence,
            voice: 'echo',
            response_format: 'mp3',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer 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`, // Your OpenAI API key
            },
            responseType: 'arraybuffer',
          },
        );

        const base64Data = base64js.fromByteArray(
          new Uint8Array(response.data),
        );
        const audioPath = `${RNFS.DocumentDirectoryPath}/speech.mp3`;
        await RNFS.writeFile(audioPath, base64Data, 'base64');

        // Add the audio to the track player
        await TrackPlayer.add({
          id: 'trackId',
          url: audioPath,
          title: 'Speech',
          artist: 'OpenAI',
        });

        // Play the audio
        TrackPlayer.play();

        // Wait for the track to finish playing
        await new Promise(resolve => {
          const listener = TrackPlayer.addEventListener(
            'playback-queue-ended',
            () => {
              listener.remove();
              resolve();
            },
          );
        });
      } catch (error) {
        console.error('Error generating speech:', error);
      }
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Button
        title="Speak Text"
        onPress={() => generateSpeech('Hello, world! ')}
      />
      {isLoading && <Text>Generating audio...</Text>}
    </View>
  );
};

export default Whisper;
