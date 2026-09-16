const fs = require('fs');

const updateFile = (path, replaceFn) => {
  let content = fs.readFileSync(path, 'utf8');
  content = replaceFn(content);
  fs.writeFileSync(path, content);
  console.log(`Updated ${path}`);
};

// 1. ExploreScreen.js
updateFile('src/screens/Explore/ExploreScreen.js', (c) => {
  c = c.replace(
    "import { Ionicons } from '@expo/vector-icons';",
    "import { useVideoPlayer, VideoView } from 'expo-video';\nimport { Ionicons } from '@expo/vector-icons';"
  );
  
  c = c.replace("const { width: SCREEN_WIDTH } = Dimensions.get('window');",
    "const { width: SCREEN_WIDTH } = Dimensions.get('window');\n\n" +
    "const GridItem = ({ item, isLargeTile }) => {\n" +
    "  const player = useVideoPlayer(\n" +
    "    item.mediaType === 'video' ? item.mediaUrl : null,\n" +
    "    (player) => {\n" +
    "      player.loop = true;\n" +
    "      player.muted = true;\n" +
    "    }\n" +
    "  );\n" +
    "\n" +
    "  return (\n" +
    "    <TouchableOpacity\n" +
    "      style={[\n" +
    "        styles.gridTile,\n" +
    "        isLargeTile && styles.gridTileLarge,\n" +
    "      ]}\n" +
    "      activeOpacity={0.8}\n" +
    "    >\n" +
    "      {item.mediaType === 'video' ? (\n" +
    "        <VideoView player={player} style={styles.gridImage} contentFit=\"cover\" />\n" +
    "      ) : (\n" +
    "        <Image source={{ uri: item.mediaUrl || item.imageUrl }} style={styles.gridImage} resizeMode=\"cover\" />\n" +
    "      )}\n" +
    "      <View style={styles.tileOverlay}>\n" +
    "        <View style={styles.tileStats}>\n" +
    "          <Ionicons name=\"heart\" size={14} color={COLORS.white} />\n" +
    "          <Text style={styles.tileStatText}>{item.likesCount}</Text>\n" +
    "        </View>\n" +
    "      </View>\n" +
    "    </TouchableOpacity>\n" +
    "  );\n" +
    "};\n"
  );
  
  const oldRenderGrid = /const renderGridItem = \(\{ item, index \}\) => \{[\s\S]*?return \([\s\S]*?\);\n  \};/;
  c = c.replace(oldRenderGrid, "const renderGridItem = ({ item, index }) => <GridItem item={item} isLargeTile={index % 9 === 0} />;");
  return c;
});

// 2. ProfileScreen.js
updateFile('src/screens/Profile/ProfileScreen.js', (c) => {
  c = c.replace("import { Video } from 'expo-av';", "import { useVideoPlayer, VideoView } from 'expo-video';");
  
  c = c.replace("const ProfileScreen = ({ navigation }) => {",
    "const ProfileGridItem = ({ item }) => {\n" +
    "  const player = useVideoPlayer(\n" +
    "    item.mediaType === 'video' ? item.mediaUrl : null,\n" +
    "    (player) => {\n" +
    "      player.loop = true;\n" +
    "      player.muted = true;\n" +
    "    }\n" +
    "  );\n" +
    "  return (\n" +
    "    <TouchableOpacity style={styles.gridTile} activeOpacity={0.8}>\n" +
    "      {item.mediaType === 'video' ? (\n" +
    "        <VideoView player={player} style={styles.gridImage} contentFit=\"cover\" />\n" +
    "      ) : (\n" +
    "        <Image source={{ uri: item.mediaUrl }} style={styles.gridImage} resizeMode=\"cover\" />\n" +
    "      )}\n" +
    "      <View style={styles.gridOverlay}>\n" +
    "        <View style={styles.gridStat}>\n" +
    "          <Ionicons name=\"heart\" size={12} color={COLORS.white} />\n" +
    "          <Text style={styles.gridStatText}>{item.likesCount}</Text>\n" +
    "        </View>\n" +
    "        <View style={styles.gridStat}>\n" +
    "          <Ionicons name=\"chatbubble\" size={12} color={COLORS.white} />\n" +
    "          <Text style={styles.gridStatText}>{item.commentsCount}</Text>\n" +
    "        </View>\n" +
    "      </View>\n" +
    "    </TouchableOpacity>\n" +
    "  );\n" +
    "};\n\n" +
    "const ProfileScreen = ({ navigation }) => {"
  );
  
  const oldRenderGrid = /const renderGridItem = \(\{ item \}\) => \([\s\S]*?\n  \);/;
  c = c.replace(oldRenderGrid, "const renderGridItem = ({ item }) => <ProfileGridItem item={item} />;");
  return c;
});

