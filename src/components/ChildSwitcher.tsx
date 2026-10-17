import { Pressable, ScrollView, View } from 'react-native';

import { colors, radius, space } from '@/constants/theme';
import { initials } from '@/lib/format';
import { useChildren } from '@/providers/children';
import { Text } from './Text';

/** Choix de l'enfant (masqué s'il n'y en a qu'un) : tous les écrans suivent la sélection. */
export function ChildSwitcher() {
  const { children, child, selectChild } = useChildren();

  if (children.length < 2) {
    return child ? <ChildChip name={child.full_name} detail={child.class_name} active /> : null;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} accessibilityRole="tablist">
      {children.map((c) => (
        <Pressable key={c.id} onPress={() => selectChild(c.id)} accessibilityRole="tab" accessibilityState={{ selected: c.id === child?.id }}>
          <ChildChip name={c.full_name} detail={c.class_name} active={c.id === child?.id} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ChildChip({ name, detail, active }: { name: string; detail: string | null; active: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: 6,
        paddingLeft: 6,
        paddingRight: space.md,
        borderRadius: radius.pill,
        backgroundColor: active ? colors.brand600 : colors.white,
        borderWidth: 1,
        borderColor: active ? colors.brand600 : colors.line,
        alignSelf: 'flex-start',
      }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.brand700 : colors.brand50 }}>
        <Text variant="caption" weight="bold" color={active ? colors.white : colors.brand700}>
          {initials(name)}
        </Text>
      </View>
      <View>
        <Text variant="small" weight="semibold" color={active ? colors.white : colors.ink}>
          {name}
        </Text>
        {!!detail && (
          <Text variant="caption" color={active ? colors.brand100 : colors.subtle}>
            {detail}
          </Text>
        )}
      </View>
    </View>
  );
}
