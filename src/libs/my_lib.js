'use strict';

//========================================================================
export function get_req_url(req) {
//========================================================================
  let ret;
 
  try {
    ret = sx_ret__create(0, 0);
    let data = {
        src_ip:         req.socket.remoteAddress.replace(/^.*:/, ''),
        src_port:       req.socket.remotePort,
        dest_url_path:  req.originalUrl,
        str_data:       null
    }
    data.str_data = data.src_ip + ":" + data.src_port;
    sx_ret__write_data(ret, data);
  } catch (e) {
    ret.error = -1;
    console.log(e);
  }

  return ret;
} 

//========================================================================
export function sx_ret__create(pid, cid) {
//========================================================================
  return {
      sid:     process.env.SYS_NO,  // sys_no
      pid:     pid,  // program id
      cid:     cid,  // code id
      value1:   0,   // return value --> 0,양수: 실행완료, 음수 : 실행중에러
      value2:   0,   // status value
      bufflen: -1,   // 버퍼에 있는 키의 수, 0이면 buffer는 string 아니면 json
      buffer:  null, // 리턴값
  }
}

//========================================================================
export function sx_ret__write_data(sx_ret, data) { //Deep Copy
//========================================================================
  sx_ret.buffer = structuredClone(data); //JSON.parse(JSON.stringify(data));
  
  if (typeof data === 'object' && typeof data !== null)
    sx_ret.bufflen = Object.keys(data).length;
  else
    sx_ret.bufflen = 0;
}