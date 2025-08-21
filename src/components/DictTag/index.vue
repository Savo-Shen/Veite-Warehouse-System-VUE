<template>
  <div>
    <!-- 先渲染 customTags -->
    <template v-for="(item, index) in customTags" :key="'custom-' + index">
      <el-tag
        :type="item.type || 'default'"
        :class="item.class || ''"
        :disable-transitions="true"
      >{{ item.label }}</el-tag>
    </template>

    <!-- 原来的 options 渲染 -->
    <template v-for="(item, index) in options">
      <template v-if="values.includes(item.value)">
        <span
          v-if="(item.elTagType == 'default' || item.elTagType == '') && (item.elTagClass == '' || item.elTagClass == null)"
          :key="item.value"
        >{{ item.label + " " }}</span>
        <el-tag
          v-else
          :disable-transitions="true"
          :key="item.value + ''"
          :type="item.elTagType === 'primary' ? '' : item.elTagType"
          :class="item.elTagClass"
        >{{ item.label + " " }}</el-tag>
      </template>
    </template>

    <!-- 未匹配显示 -->
    <template v-if="unmatch && showValue">
      {{ unmatchArray | handleArray }}
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const unmatchArray = ref([]);

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  value: [Number, String, Array],
  showValue: {
    type: Boolean,
    default: true,
  },
  separator: {
    type: String,
    default: ",",
  },
  // 新增：直接渲染的标签列表
  customTags: {
    type: Array,
    default: () => [], // [{ value: 'xx', label: '显示文本', type: 'success', class: '' }]
    // success
    // 成功，绿色
    // info
    // 灰色
    // warning
    // 警告，黄色
    // danger
    // 危险，红色
    // primary
    // 主要，深蓝色
    // default
    // 蓝色

  }
});

const values = computed(() => {
  if (!props.value) return [];
  return Array.isArray(props.value)
    ? props.value.map(item => '' + item)
    : String(props.value).split(props.separator);
});

const unmatch = computed(() => {
  unmatchArray.value = [];
  if (!props.value || props.options.length === 0) return false;
  let unmatchFlag = false;
  values.value.forEach(item => {
    if (!props.options.some(v => v.value === item)) {
      unmatchArray.value.push(item)
      unmatchFlag = true
    }
  });
  return unmatchFlag;
});

function handleArray(array) {
  return array.length ? array.join(' ') : '';
}
</script>