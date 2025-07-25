<template>
  <div class="app-container">
    <el-card>
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
        <el-form-item label="商品编号" prop="itemCode">
          <el-input v-model="queryParams.itemCode" placeholder="请输入商品编号" clearable @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="商品名称" prop="itemName">
          <el-input v-model="queryParams.itemName" placeholder="请输入商品名称" clearable @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="商品品牌" prop="itemBrand">
          <el-select v-model="queryParams.itemBrand" clearable filterable>
            <el-option
              v-for="item in useWmsStore().itemBrandList"
              :key="item.id"
              :label="item.brandName"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="mt20">
      <div style="display: flex; align-items: stretch; min-height: 600px;">
        <div style="height: 100%;">
          <div style="display: flex;align-items: center;justify-content: space-between">
            <span style="font-size: 18px;line-height: 18px">商品分类</span>
            <el-button class="mr10" style="font-size:12px;line-height: 14px" plain
                     @click="handleAddType(false)"
                     type="primary" icon="Plus">新增分类
            </el-button>
          </div>
          <el-tree
            :data="itemCategoryTreeOptionsList"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            style="width: 400px;"
            class="mr10 mt10"
            @nodeClick="handleQueryType"
            :default-expand-all="true"
            :highlight-current="true"
            node-key="label"
            current-node-key="全部"
            draggable
            :allow-drop="collapse"
            @node-drop="handleNodeDrop"
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
            <span class="custom-tree-node">
              <span>{{ node.label }}</span>
              <span>
                <el-button type="primary" @click.stop="append(data)" link
                         v-if="data.label !== '全部' && node.level < 2" icon="Plus" style="font-size: 12px">新增子分类</el-button>
                <el-button type="primary" @click.stop="remove(node, data)" link
                         v-if="data.label !== '全部'" icon="Delete" style="font-size: 12px">删除</el-button>
                <el-button type="primary" icon="Edit" @click.stop="edit(node, data)" link
                         v-if="data.label !== '全部'" style="font-size: 12px">修改</el-button>
              </span>
            </span>
            </template>
          </el-tree>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; height: 100%; overflow-x: auto;">
          <div style="flex: 1;  width: 100%;">
          <div style="display: flex;align-items: start;justify-content: space-between">
            <span class="mr10" style="font-size: 18px;">商品列表</span>
            <el-button type="primary" plain icon="Plus" @click="handleAdd" class="mb10">新增商品</el-button>
          </div>
          <el-table :data="itemList" @selection-change="handleSelectionChange" :span-method="spanMethod" border empty-text="暂无商品" v-loading="loading" cell-class-name="my-cell">
            <el-table-column label="商品信息" prop="itemId" min-width="160">
              <template #default="{ row }">
                <div>{{ row.item.itemName + (row.item.itemCode ? ('(' +  row.item.itemCode + ')') : '') }}</div>
                <div v-if="row.item.itemBrand">{{ row.item.itemBrand ? ('品牌：' + useWmsStore().itemBrandMap.get(row.item.itemBrand)?.brandName) : '' }}</div>
                <div v-if="row.item.itemCategory">{{ row.item.itemCategory ? ('分类：' + useWmsStore().itemCategoryMap.get(row.item.itemCategory)?.categoryName) : '' }}</div>
              </template>
            </el-table-column>
            <el-table-column label="规格信息" prop="skuName" align="left" min-width="160">
              <template #default="{ row }">
                <div>{{ row.itemSku.skuName }}</div>
                <div v-if="row.itemSku.skuCode">编号：{{ row.itemSku.skuCode }}</div>
                <div v-if="row.itemSku.barcode">条码：{{ row.itemSku.barcode }}</div>
              </template>
            </el-table-column>
            <el-table-column label="金额(元)" width="140" align="left">
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
            <el-table-column label="重量(kg)" width="140" align="left">
              <template #default="{ row }">
                <div v-if="row.itemSku.netWeight" class="flex-space-between">
                  <span>净重：</span>
                  <div>
                    {{ (row.itemSku.netWeight || row.itemSku.netWeight === 0) ? row.itemSku.netWeight : '' }}
                  </div>
                </div>
                <div v-if="row.itemSku.grossWeight" class="flex-space-between">
                  <span>毛重：</span>
                  <div>
                    {{ (row.itemSku.grossWeight || row.itemSku.grossWeight === 0) ? row.itemSku.grossWeight : '' }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="长宽高(cm)" align="right" min-width="120">
              <template #default="{ row }">
                <div>{{ getVolumeText(row.itemSku) }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="right" prop="itemId" width="200">
              <template #default="scope">
                <el-button link type="primary" @click="handleDelete(scope.row)" icon="Delete">删除</el-button>
                <el-button link type="primary" @click="handleUpdate(scope.row)" icon="Edit">修改</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="total>0" :total="total" v-model:page="queryParams.pageNum"
                      v-model:limit="queryParams.pageSize" @pagination="getList"/>
          </div>
          <div>
            <!-- 分页组件外层div，保持结构一致 -->
          </div>
        </div>
      </div>
    </el-card>
    <!-- 添加或修改物料对话框 -->
    <el-drawer :title="dialog.title" v-model="dialog.visible" size="80%" append-to-body :close-on-click-modal="false">
      <div v-loading="skuLoading">
        <el-card>
          <el-form ref="itemFormRef" :model="form" :rules="rules" label-width="108px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="商品名称" prop="itemName">
                  <el-input v-model="form.itemName" placeholder="请输入名称"/>
                </el-form-item>
              </el-col>
              <el-col :span="10">
                <el-form-item label="商品分类" prop="itemCategory">
                  <el-tree-select
                    ref="treeRef"
                    v-model="form.itemCategory"
                    :data="itemCategoryTreeSelectList"
                    :props="{ value: 'id', label: 'label', children: 'children' }"
                    value-key="id"
                    placeholder="请选择分类"
                    check-strictly
                    style="width: 100%!important;"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="1">
                <el-button link icon="Plus" type="primary" style="height: 32px!important;line-height: 32px!important;"
                           @click="handleAddType(true)">新增分类
                </el-button>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="商品编号" prop="itemCode">
                  <el-input v-model="form.itemCode" placeholder="请输入编号"/>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商品单位" prop="unit">
                  <el-input v-model="form.unit" placeholder="请输入单位类别"/>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="商品品牌" prop="itemBrand">
                  <el-select v-model="form.itemBrand" clearable filterable style="width: 100%!important;">
                    <el-option
                      v-for="item in useWmsStore().itemBrandList"
                      :key="item.id"
                      :label="item.brandName"
                      :value="item.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
        <el-card class="mt20">
          <template #header>
            <div class="card-header">
              <span>规格</span>
            </div>
          </template>
          <el-form :model="skuForm" :rules="skuRules" ref="skuFormRef" :show-message="false">
            <el-table :data="skuForm.itemSkuList" border cell-class-name="my-cell">
              <el-table-column label="规格名称" prop="skuName">
                <template #default="scope">
                  <el-form-item :prop="'itemSkuList.' + scope.$index + '.skuName'" :rules="skuRules.skuName"
                                style="margin-bottom: 0!important;">
                    <el-input v-model="scope.row.skuName" placeholder="请输入规格名称"/>
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="编号/条码" width="250">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5" style="width: 50px">编号</span>
                    <el-input v-model="scope.row.skuCode" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5" style="width: 50px">条码</span>
                    <el-input v-model="scope.row.barcode" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="长/宽/高(cm)" width="200">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">长</span>
                    <el-input-number :controls="false" :min="0" :precision="1" @wheel.native.prevent class="mr5" v-model="scope.row.length" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">宽</span>
                    <el-input-number :controls="false" :min="0" :precision="1" @wheel.native.prevent class="mr5" v-model="scope.row.width" />
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">高</span>
                    <el-input-number :controls="false" :min="0" :precision="1" @wheel.native.prevent v-model="scope.row.height" />
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="净重/毛重(kg)" width="240">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">净重</span>
                    <el-input-number :controls="false" :min="0" :precision="3" @wheel.native.prevent v-model="scope.row.netWeight"/>
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">毛重</span>
                    <el-input-number :controls="false" :min="0" :precision="3" @wheel.native.prevent v-model="scope.row.grossWeight"/>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="成本价/销售价(元)" width="240">
                <template #default="scope">
                  <div class="flex-center">
                    <span class="mr5">成本价</span>
                    <el-input-number :controls="false" :min="0" :precision="3" @wheel.native.prevent v-model="scope.row.costPrice"/>
                  </div>
                  <div class="flex-center mt5">
                    <span class="mr5">销售价</span>
                    <el-input-number :controls="false" :min="0" :precision="3" @wheel.native.prevent v-model="scope.row.sellingPrice"/>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作" class-name="small-padding fixed-width" width="80" align="right">
                <template #default="scope">
                  <el-button link icon="Delete" type="primary" @click="handleDeleteItemSku(scope.row, scope.$index)">删除</el-button>
                </template>
              </el-table-column>
              <template #append v-if="skuForm.itemSkuList.length">
                <div style="padding: 6px 2px 6px 2px;text-align: center;">
                  <el-button text class="add-btn" icon="Plus" type="primary" @click="onAppendBtnClick">添加商品规格
                  </el-button>
                </div>
              </template>
              <template #empty>
                <div style="padding: 2px 2px 6px 2px;text-align: center;width: 100%!important;">
                  <el-button text class="add-btn" icon="Plus" type="primary" @click="onAppendBtnClick">添加商品规格
                  </el-button>
                </div>
              </template>
            </el-table>
          </el-form>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" @click="submitFormTemporary">暂 存</el-button>
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-drawer>
    <!-- 添加或修改物料类型对话框 -->
    <el-dialog :title="categoryDialog.title" v-model="categoryDialog.visible" width="500px" append-to-body
               :close-on-click-modal="false">
      <el-form ref="itemCategoryFormRef" :model="categoryForm" :rules="typeRules" label-width="128px" @submit.native.prevent>
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="itemCategoryTreeSelectList"
            :props="{ value: 'id', label: 'label', children: 'children' }"
            value-key="id"
            placeholder="上级分类"
            check-strictly
            style="width: 100%!important;"
            clearable
          />
        </el-form-item>
        <el-form-item label="商品分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入商品分类名称" @keyup.enter="submitCategoryForm"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitCategoryForm">确 定</el-button>
          <el-button @click="cancelType">取 消</el-button>
        </div>
      </template>
      <div id="qrcode"></div>
    </el-dialog>
    <div id="outSkuIdBox" style="display: none">
      <img :src="qrcode"/>
      <canvas ref="barcode"></canvas>
    </div>
  </div>
</template>

<script setup name="Item">
import {getItem, delItem, addItem, updateItem} from '@/api/wms/item';
import {computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs} from 'vue';
import {ElForm, ElTree, ElTreeSelect} from 'element-plus';
import {
  updateItemCategory,
  addItemCategory,
  delItemCategory,
  updateOrderNum
} from "@/api/wms/itemCategory";
import {getRowspanMethod} from "@/utils/getRowSpanMethod";
import {listItemSkuPage, delItemSku, listItemSku} from "@/api/wms/itemSku";
import {useRoute} from "vue-router";
import Qrcode from 'qrcode'
import JSBarcode from 'jsbarcode'
import {useWmsStore} from '@/store/modules/wms'

const barcode = ref(null)
const route = useRoute()
const {proxy} = getCurrentInstance();
const itemList = ref([]);
const itemCategoryTreeSelectList = computed(() => useWmsStore().itemCategoryTreeList);
const itemCategoryTreeOptionsList = computed(() => {
  let data = [...itemCategoryTreeSelectList.value];
  data.unshift({
    id: -1,
    label: '全部',
    children: []
  });
  return data;
});
const buttonLoading = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const skuLoading = ref(false)
const queryFormRef = ref(ElForm);
const itemFormRef = ref(ElForm);
const itemCategoryFormRef = ref(ElForm);
const spanMethod = computed(() => getRowspanMethod(itemList.value, rowSpanArray.value))
const rowSpanArray = ref(['itemId'])
const qrcode = ref(null)
const append = (data) => {
  // resetType();
  categoryForm.value.categoryName = undefined;
  categoryForm.value.parentId = data.id;
  categoryDialog.visible = true;
}

const remove = async (node, data) => {
  const ids = data.id
  await proxy?.$modal.confirm('确认删除分类【' + data.label + '】吗？');
  await delItemCategory(ids);
  proxy?.$modal.msgSuccess("删除成功");
  useWmsStore().getItemCategoryList();
  useWmsStore().getItemCategoryTreeList();
}
const edit = (node, data) => {
  if (node.level > 1) {
    categoryForm.value.parentId = node.parent.data.id
  }
  categoryForm.value.id = data.id;
  // resetType();
  categoryForm.value.categoryName = data.label;
  categoryDialog.title = "修改商品分类";
  categoryDialog.visible = true;
}
const dialog = reactive({
  visible: false,
  title: ''
});
const categoryDialog = reactive({
  visible: false,
  title: ''
});
const showParent = ref(false)
const initFormData = {
  id: undefined,
  itemCode: undefined,
  itemName: undefined,
  itemCategory: undefined,
  unit: undefined,
  itemBrand: undefined,
  remark: undefined,
}
const initCategoryFormData = {
  id: undefined,
  parentId: undefined,
  ancestors: undefined,
  categoryName: undefined,
  orderNum: 0,
  status: undefined,
}
const data = reactive({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemCode: undefined,
    itemName: undefined,
    itemType: undefined
  },
  rules: {
    id: [
      {required: true, message: "不能为空", trigger: "blur"}
    ],
    itemName: [
      {required: true, message: "名称不能为空", trigger: "blur"}
    ],
    itemCategory: [
      {required: true, message: "分类不能为空", trigger: "blur"}
    ],
    warehouseId: [
      {required: true, message: "所属仓库不能为空", trigger: "blur"}
    ],
    quantity: [
      {required: true, message: "安全库存不能为空", trigger: "blur"}
    ],
    remark: [
      {required: true, message: "备注不能为空", trigger: "blur"}
    ],
  }
});
const categoryData = reactive({
  form: {...initCategoryFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 1000,
    parentId: undefined,
    categoryName: undefined,
    orderNum: undefined,
    status: undefined,
  },
  rules: {
    id: [
      {required: true, message: "商品分类id不能为空", trigger: "blur"}
    ],
    // parentId: [
    //   {required: true, message: "父物料类型id不能为空", trigger: "blur"}
    // ],
    categoryName: [
      {required: true, message: "商品分类名称不能为空", trigger: "blur"}
    ],
    status: [
      {required: true, message: "商品分类状态不能为空", trigger: "change"}
    ],
  }
});
const {queryParams, form, rules} = toRefs(data);

const {queryParams: typeQueryParams, form: categoryForm, rules: typeRules} = toRefs(categoryData);
const currentType = ref()
/** 查询物料列表 */
const getList = async () => {
  loading.value = true;
  const res = await listItemSkuPage(queryParams.value);
  const content = [...res.rows];
  itemList.value = content.map((it) => ({...it, id: it.skuId,itemId: it?.item?.id}));
  total.value = res.total;
  loading.value = false;
}
const handleAddType = (show) => {
  categoryDialog.title = "新增商品分类";
  showParent.value = show
  categoryDialog.visible = true;
  if (show) {
    categoryForm.value.parentId = undefined
  }
  nextTick(() => {
    categoryForm.value.categoryName = undefined;
  });
}
const skuForm = reactive({
  itemSkuList: []
})
const skuFormRef = ref(ElForm)
const skuRules = {
  skuName: [{required: true, message: '规格名称不能为空', trigger: 'blur'}]
}
// sku 管理
const resetItemSkuList = () => {
  skuForm.itemSkuList = []
  skuForm.itemSkuList.push({
    id: '',
    itemId: '',
    barcode: '',
    inPrice: null,
    outPrice: null,
    skuName: '',
    quantity: null,
  })
}

const onAppendBtnClick = () => {
  skuForm.itemSkuList.push({
    id: '',
    itemId: '',
    barcode: '',
    inPrice: null,
    outPrice: null,
    skuName: '',
    quantity: null,
  })
}
const handleDeleteItemSku = async (row, index) => {
  if (!row.id) {
    skuForm.itemSkuList.splice(index, 1);
    return
  }
  if (skuForm.itemSkuList.length === 1) {
    return proxy?.$modal.msgError("至少包含一个商品规格");
  }
  await proxy?.$modal.confirm('确认删除规格【' + row.skuName + '】吗？');
  loading.value = true;
  await delItemSku(row.id).finally(()=> loading.value = false);
  proxy?.$modal.msgSuccess("删除成功");
  // const res = await getItem(row.itemId);
  // skuForm.itemSkuList = res.data.sku
  // 修复了不能连续删除的方式
  const res = await listItemSku({ itemId: row.itemId });
  skuForm.itemSkuList.splice(0, skuForm.itemSkuList.length, ...res.data);
  form.value = res.data
}
const collapse = (draggingNode, dropNode, type) => {
  //注掉的是同级拖拽
  if (draggingNode.data.label !== '全部' && draggingNode.level === dropNode.level && draggingNode.parent.id == dropNode.parent.id) {
    if (dropNode.data.label === '全部') {
      return type === 'next';
    } else {
      return type === 'prev' || type === 'next'
    }
  } else {
    // 不同级进行处理
    return false
  }
}
const handleNodeDrop = async (draggingNode, dropNode, dropType, ev) => {
  if (dropNode.level === 1) {
    await updateOrderNum(dropNode.parent.data.filter(it => it.id !== -1));
  } else {
    await updateOrderNum(dropNode.parent.data.children);
  }
}
/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}
const cancelType = () => {
  resetType();
  categoryDialog.visible = false;
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
  itemFormRef.value.resetFields();
}

/** 表单重置 */
const resetType = () => {
  categoryForm.value = {...initCategoryFormData};
  itemCategoryFormRef.value.resetFields();
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
const handleAdd = () => {
  resetItemSkuList()
  dialog.visible = true;
  dialog.title = "新增商品";
  nextTick(async () => {
    reset();
  });
}
/** 修改按钮操作 */
const handleUpdate = (row) => {
  resetItemSkuList()
  skuLoading.value = true
  dialog.visible = true;
  dialog.title = "修改商品";
  nextTick(async () => {
    reset();
    const _id = row?.itemId || ids.value[0]
    const res = await listItemSku({'itemId':_id});
    Object.assign(skuForm.itemSkuList, res.data)
    skuLoading.value = false
    Object.assign(form.value, row.item);
  });
}
const handleQueryType = (node, data) => {
  queryParams.value.pageNum = 1
  if (data.data.label === '全部') {
    queryParams.value.itemCategory = '';
    currentType.value = '';
    getList();
  } else {
    queryParams.value.itemCategory = data.data.id;
    currentType.value = data.data.id;
    getList();
  }
}
/** 提交按钮 */
const submitForm = () => {
  form.value.sku = skuForm.itemSkuList
  itemFormRef.value.validate(async (valid) => {
    if (valid) {
      let flag = true
      if (!skuForm.itemSkuList || skuForm.itemSkuList.length === 0) {
        proxy?.$modal.msgError("至少包含一个商品规格");
        flag = false
      }
      await skuFormRef.value.validate((valid2) => {
        if (!valid2) {
          flag = false;
        }
      })
      if (flag) {
        buttonLoading.value = true;
        if (form.value.id) {
          await updateItem(form.value).finally(() => buttonLoading.value = false);
        } else {
          await addItem(form.value).finally(() => buttonLoading.value = false);
        }
        proxy?.$modal.msgSuccess("修改成功");
        dialog.visible = false;
        await getList();
      }
    }
  });
}
const submitFormTemporary = () => {
  form.value.sku = skuForm.itemSkuList
  itemFormRef.value.validate(async (valid) => {
    if (valid) {
      let flag = true
      if (!skuForm.itemSkuList || skuForm.itemSkuList.length === 0) {
        proxy?.$modal.msgError("至少包含一个商品规格");
        flag = false
      }
      await skuFormRef.value.validate((valid2) => {
        if (!valid2) {
          flag = false;
        }
      })
      if (flag) {
        buttonLoading.value = true;
        if (form.value.id) {
          await updateItem(form.value).finally(() => buttonLoading.value = false);
        } else {
          await addItem(form.value).finally(() => buttonLoading.value = false);
        }
        proxy?.$modal.msgSuccess("暂存成功");
        const res = await listItemSku({ itemId: form.value.id });
        skuForm.itemSkuList.splice(0, skuForm.itemSkuList.length, ...res.data);
      }
    }
  });
}
const submitCategoryForm = () => {
  itemCategoryFormRef.value.validate(async (valid) => {
    if (valid) {
      buttonLoading.value = true;
      if (categoryForm.value.id) {
        await updateItemCategory(categoryForm.value).finally(() => buttonLoading.value = false);
      } else {
        await addItemCategory(categoryForm.value).finally(() => buttonLoading.value = false);
      }
      proxy?.$modal.msgSuccess(categoryForm.value.id ? '修改成功' : '新增成功');
      categoryDialog.visible = false;
      useWmsStore().getItemCategoryList();
      useWmsStore().getItemCategoryTreeList();
    }
  });
}
/** 删除按钮操作 */
const handleDelete = async (row) => {
  const _ids = row?.itemId || ids.value;
  await proxy?.$modal.confirm('确认删除商品【' + row?.item.itemName + '】吗？');
  loading.value = true;
  await delItem(_ids).finally(()=> loading.value = false);
  proxy?.$modal.msgSuccess("删除成功");
  await getList();
}
const treeRef = ref(null)
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('wms/item/export', {
    ...queryParams.value
  }, `item_${new Date().getTime()}.xlsx`)
}
/** 下载条形码 */
const downloadBarcode = (row) => {
  JSBarcode(barcode.value, row.barcode, {
    format: "CODE128",
    displayValue: true
  })
  const canvas = barcode.value
  //创建a标签
  let a = document.createElement('a')
  //设置下载文件的名字
  a.download = row.barcode
  a.href = canvas.toDataURL("image/png")
  a.click()
}
/** 下载二维码 */
const downloadQrcode = async (row) => {
  qrcode.value = await Qrcode.toDataURL(row.barcode)
  //创建a标签
  let a = document.createElement('a')
  //获取二维码的url并赋值为a.href
  a.href = qrcode.value
  //设置下载文件的名字
  a.download = row.barcode
  //点击事件，相当于下载
  a.click()
  //提示信息
  // this.$message.warn('下载中，请稍后...')
}
const getVolumeText = (itemSku) => {
  if((itemSku.length || itemSku.length === 0) && (itemSku.width || itemSku.width === 0) && (itemSku.height || itemSku.height === 0)) {
    return itemSku.length + ' * ' + itemSku.width + ' * ' + itemSku.height
  }
  return ((itemSku.length || itemSku.length === 0) ? ('长：' + itemSku.length) : '')
    + ((itemSku.width || itemSku.width === 0) ? (' 宽：' + itemSku.width) : '')
    + ((itemSku.height || itemSku.height === 0) ? (' 高：' + itemSku.height) : '')
}
onMounted(() => {
  nextTick(()=>{
    getList();
    if (route.query.openDrawer) {
      handleAdd()
    }
  })
});
</script>
<style>
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.el-tree-node__content {
  display: flex;
  align-items: center;
  height: 35px;
  cursor: pointer;
}

.el-table .my-cell {
  vertical-align: top
}

.el-table__empty-text {
  width: 100%;
}

</style>
