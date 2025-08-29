<template>
  <el-drawer :model-value="show" title="商品选择" @close="handleCancelClick" :size="size" :close-on-click-modal="false" append-to-body>
    <el-form :model="query" ref="queryFormRef" :inline="true" label-width="70px" @submit.prevent @keyup.enter="loadAll">
      <div style="display: flex;">
        <el-form-item label="智能搜索" style="flex: 1;">
          <el-input v-model="query.itemKeywords" clearable placeholder="输入商品或规格名称"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadAll">搜索</el-button>
          <el-button type="text" @click="showSearch = !showSearch">
            <span v-if="showSearch">收起高级搜索</span>
            <span v-else>展开高级搜索</span>
        </el-button>
        </el-form-item>
      </div>
      <el-collapse-transition>
        <div v-if="showSearch">
          <el-form-item label="商品名称" prop="itemName">
            <el-input v-model="query.itemName" placeholder="请输入商品名称" clearable/>
          </el-form-item>
          <el-form-item label="商品规格" prop="skuName">
            <el-input v-model="query.skuName" placeholder="请输入商品规格" clearable/>
          </el-form-item>
          <el-form-item label="商品品牌" prop="itemBrand">
            <el-select v-model="query.itemBrand" clearable filterable>
              <el-option
                v-for="item in useWmsStore().itemBrandList"
                :key="item.id"
                :label="item.brandName"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="商品位置" prop="itemLocationId">
            <el-select v-model="query.itemLocationId" clearable filterable>
              <el-option
                v-for="item in useWmsStore().locationList"
                :key="item.id"
                :label="item.locationCode + ' (' + item.locationName + ')'"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
        </div>
      </el-collapse-transition>
    </el-form>
    <el-table :data="list" @selection-change="handleSelectionChange" border :row-key="getRowKey" empty-text="暂无商品" v-loading="loading" ref="skuSelectFormRef" cell-class-name="my-cell">
      <el-table-column type="selection" width="55" :reserve-selection="true" v-if="!singleSelect" :selectable="judgeSelectable"/>
      <el-table-column label="商品信息" prop="itemId">
        <template #default="{ row }">
          <div>{{ row.item.itemName }}</div>
          <div v-if="row.item.itemCode">编号：{{ row.item.itemCode }}</div>
          <div v-if="row.item.itemBrand">品牌：{{ useWmsStore().itemBrandMap.get(row.item.itemBrand).brandName }}</div>
        </template>
      </el-table-column>
      <el-table-column label="规格信息">
        <template #default="{ row }">
          <div>{{ row.itemSku.skuName }}</div>
          <div v-if="row.itemSku.skuCode">编号：{{ row.itemSku.skuCode }}</div>
          <div v-if="row.itemSku.barcode">条码：{{ row.itemSku.barcode }}</div>
        </template>
      </el-table-column>
       <el-table-column label="位置信息" prop="locationId">
        <template #default="{ row }">
          <dict-tag v-if="!row.location"
            :customTags="[
              { label: '暂无位置', type: 'info' }
            ]"
          />
          <div v-else>
            <dict-tag :customTags="[
              { label: row.location.locationCode, type: 'primary' }
            ]"
            />
            <div>{{ row.location.locationName }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="价格(元)" width="160" align="left">
        <template #default="{ row }">
          <div v-if="row.itemSku.costPrice" class="flex-space-between">
            <span>成本价：</span>
            <div>{{ (row.itemSku.costPrice || row.itemSku.costPrice === 0) ? row.itemSku.costPrice : '' }}</div>
          </div>
          <div v-if="row.itemSku.sellingPrice" class="flex-space-between">
            <span>销售价：</span>
            <div>{{ (row.itemSku.sellingPrice || row.itemSku.sellingPrice === 0) ? row.itemSku.sellingPrice : '' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="重量(kg)" width="160" align="left">
        <template #default="{ row }">
          <div v-if="row.itemSku.netWeight" class="flex-space-between">
            <span>净重：</span>
            <div>{{ (row.itemSku.netWeight || row.itemSku.netWeight === 0) ? row.itemSku.netWeight : '' }}</div>
          </div>
          <div v-if="row.itemSku.grossWeight" class="flex-space-between">
            <span>毛重：</span>
            <div>{{ (row.itemSku.grossWeight || row.itemSku.grossWeight === 0) ? row.itemSku.grossWeight : '' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="长宽高(cm)" align="right" width="250">
        <template #default="{ row }">
          <div>{{ getVolumeText(row) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" v-if="singleSelect" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleChooseSku(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-row>
      <pagination v-show="total > 0" :total="total" :page-sizes="[5, 10, 20, 50]" v-model:limit="pageReq.size" v-model:page="pageReq.page"
                  @pagination="getList" class="mr10"/>
    </el-row>
    <template v-slot:footer>
      <div style="width: 100%;display: flex;justify-content: space-between">
        <span>
          <el-button @click="goCreateItem" icon="Plus">创建商品</el-button>
          <el-button @click="loadAll" icon="Refresh">刷新</el-button>
        </span>
        <span>
          <el-button @click="handleCancelClick">取消</el-button>
          <el-button type="primary" @click="handleOkClick" v-if="!singleSelect">确认</el-button>
      </span>
      </div>
    </template>
  </el-drawer>
</template>
<script setup lang="ts" name="SkuSelect">
import {computed, getCurrentInstance, onMounted, onBeforeUnmount, reactive, ref} from 'vue';
import {ElForm} from "element-plus";
import {listItemSkuPage} from "@/api/wms/itemSku";
import {useRouter} from "vue-router";
import {useWmsStore} from '@/store/modules/wms'

const { proxy } = getCurrentInstance()

const router = useRouter()
const loading = ref(false)
const showSearch = ref(false);
const deptOptions = ref([]);
const query = reactive({
  itemName: '',
  itemCode: '',
  skuName: '',
  barcode: ''
});
const selectItemSkuVoCheck = ref([])
const skuSelectFormRef = ref(null)
const total = ref(0);
const pageReq = reactive({
  page: 1,
  size: 10,
});
const list = ref([]);
const rightList = ref([]);
const rightListKeySet = computed(() => {
  const set = new Set();
  rightList.value.forEach((it) => set.add(it.id));
  return set
});

const loadAll = () => {
  pageReq.page = 1
  getList()
};
const getRowKey = (row: any) => {
  return row.id;
}
const getList = () => {
  const data = {
    ...query,
    pageNum: pageReq.page,
    pageSize: pageReq.size
  }
  loading.value = true
  listItemSkuPage(data).then((res) => {
    const content = [...res.rows];
    list.value = content.map((it) => ({...it, id: it.skuId, checked: false}));
    total.value = res.total;
  }).then(() => toggleSelection()).finally(() => loading.value = false);
}
const goCreateItem = () => {
  // const data = proxy.$router.resolve({path: '/system/itemManage2', query: {openDrawer: true}})
  const data = proxy.$router.resolve({path: '/basic/item', query: {openDrawer: true}})
  window.open(data.href, '_blank')
}
// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: '30%'
  },
  singleSelect:{
    type: Boolean,
    default: false
  },
  selectedSku: {
    type: Array,
    default: []
  }
})

const show = computed(() => {
  return props.modelValue;
})

// 定义事件
const emit = defineEmits<{
  (e: 'handleCancelClick')
  (e: 'handleOkClick', value)
  (e: 'handleSingleOkClick', value)
}>()

function handleCancelClick() {
  emit('handleCancelClick');
  clearQuantity()
}

function handleChooseSku(row) {
  emit('handleSingleOkClick', row);
}

function handleOkClick() {
  emit('handleOkClick', selectItemSkuVoCheck.value);
  clearQuantity()
}
/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  selectItemSkuVoCheck.value = selection
}

const toggleSelection = () => {
  props.selectedSku.forEach(selected => {
    const index = list.value.findIndex(it => selected.id=== it.id)
    if (index !== -1) {
      skuSelectFormRef.value.toggleRowSelection(list.value[index], true)
    }
  })
}

const judgeSelectable = (row) => {
  if (props.selectedSku.find(selected => selected.id === row.id)) {
    return false;
  }
  return true
}


function clearQuantity() {
  skuSelectFormRef.value.clearSelection()
}

const getVolumeText = (row) => {
  if((row.length || row.length === 0) && (row.width || row.width === 0) && (row.height || row.height === 0)) {
    return row.length + ' * ' + row.width + ' * ' + row.height
  }
  return ((row.length || row.length === 0) ? ('长：' + row.length) : '')
    + ((row.width || row.width === 0) ? (' 宽：' + row.width) : '')
    + ((row.height || row.height === 0) ? (' 高：' + row.height) : '')
}

// 键盘事件处理
const handleKeydown = (e) => {
  if (e.key === 'ArrowLeft') {
    // 上一页
    if (pageReq.page > 1) {
      pageReq.page--
      getList()
    }
  } else if (e.key === 'ArrowRight') {
    // 下一页
    const maxPage = Math.ceil(total.value / pageReq.size)
    if (pageReq.page < maxPage) {
      pageReq.page++
      getList()
    }
  }
}

defineExpose({
  getList
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  loadAll();
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

</script>
<style lang="scss">
.el-table .my-cell {
  vertical-align: top
}
</style>

