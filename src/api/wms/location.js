import request from '@/utils/request';

/**
 * 查询位置列表
 * @param query
 * @returns {*}
 */

export function listLocation(query) {
  return request({
    url: '/wms/location/list',
    method: 'get',
    params: query
  });
};

export function listLocationNoPage(query) {
  return request({
    url: '/wms/location/listNoPage',
    method: 'get',
    params: query
  });
};

/**
 * 查询位置详细
 * @param id
 */
export function getLocation(id) {
  return request({
    url: '/wms/location/' + id,
    method: 'get'
  });
};

/**
 * 新增位置
 * @param data
 */
export function addLocation(data) {
  return request({
    url: '/wms/location',
    method: 'post',
    data: data
  });
};

/**
 * 修改位置
 * @param data
 */
export function updateLocation(data) {
  return request({
    url: '/wms/location',
    method: 'put',
    data: data
  });
};

/**
 * 删除位置
 * @param id
 */
export function delLocation(id) {
  return request({
    url: '/wms/location/' + id,
    method: 'delete'
  });
};
