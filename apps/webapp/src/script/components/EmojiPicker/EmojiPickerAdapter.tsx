/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import type {FunctionComponent} from 'react';

import EmojiPickerReact, {Categories, EmojiClickData, EmojiStyle, SkinTones, Theme} from 'emoji-picker-react';

import {t} from 'Util/localizerUtil';

export {SkinTones};

export interface EmojiPickerSelection {
  readonly emoji: string;
  readonly activeSkinTone: string;
}

export interface EmojiPickerAdapterProperties {
  readonly onEmojiClick: (emojiPickerSelection: EmojiPickerSelection) => void;
  readonly searchPlaceholder: string;
  readonly defaultSkinTone: SkinTones;
}

export const defaultEmojiStyle = EmojiStyle.NATIVE;

export const EmojiPickerAdapter: FunctionComponent<EmojiPickerAdapterProperties> = properties => {
  const {onEmojiClick, searchPlaceholder, defaultSkinTone} = properties;

  const isPhone = window.matchMedia('(max-width: 720px)').matches;

  function handleEmojiClick(emojiClickData: EmojiClickData) {
    const emojiPickerSelection: EmojiPickerSelection = {
      emoji: emojiClickData.emoji,
      activeSkinTone: emojiClickData.activeSkinTone,
    };

    onEmojiClick(emojiPickerSelection);
  }

  return (
    <EmojiPickerReact
      emojiStyle={defaultEmojiStyle}
      onEmojiClick={handleEmojiClick}
      searchPlaceHolder={searchPlaceholder}
      defaultSkinTone={defaultSkinTone}
      theme={Theme.DARK}
      previewConfig={{showPreview: false}}
      autoFocusSearch={!isPhone}
      width={isPhone ? '100%' : 350}
      height={isPhone ? Math.round(Math.min(window.innerHeight * 0.6, 460)) : 450}
      categories={[
        {category: Categories.SUGGESTED, name: t('novaEmojiCategoryRecent')},
        {category: Categories.SMILEYS_PEOPLE, name: t('novaEmojiCategoryPeople')},
        {category: Categories.ANIMALS_NATURE, name: t('novaEmojiCategoryNature')},
        {category: Categories.FOOD_DRINK, name: t('novaEmojiCategoryFood')},
        {category: Categories.TRAVEL_PLACES, name: t('novaEmojiCategoryTravel')},
        {category: Categories.ACTIVITIES, name: t('novaEmojiCategoryActivities')},
        {category: Categories.OBJECTS, name: t('novaEmojiCategoryObjects')},
        {category: Categories.SYMBOLS, name: t('novaEmojiCategorySymbols')},
        {category: Categories.FLAGS, name: t('novaEmojiCategoryFlags')},
      ]}
    />
  );
};
