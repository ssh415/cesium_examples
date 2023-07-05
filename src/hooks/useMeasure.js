import {ref} from "vue";
import * as Cesium from 'cesium'

export function useMeasure(viewer) {
    const tempEntities = ref([])
    const floatingPoint = ref()
    const activeShape = ref()
    const pointNum = ref(0)

    const drawPoint = (position) => {
        // 本质上就是添加一个点的实体
        return viewer.entities.add({
            position: position,
            point: {
                color: Cesium.Color.WHEAT,
                pixelSize: 5,
                outlineWidth: 3,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND // 规定贴地
            }
        })
    }

    const drawPointLabel = (position, pointNum) => {
        // 本质上就是添加一个点的实体
        return viewer.entities.add({
            name: '点几何对象',
            position: position,
            point: {
                color: Cesium.Color.WHEAT,
                pixelSize: 5,
                outlineWidth: 3,
                disableDepthTestDistance: Number.POSITIVE_INFINITY, //
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND // 规定贴地
            },
            label: {
                text: pointNum,
                font: '30px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                backgroundColor: Cesium.Color.BLACK,
                showBackground: true,
                style: Cesium.LabelStyle.FILL,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER
            }
        })
    }

    const drawPolyline = (positions) => {
        if (positions.length < 1) return
        return viewer.entities.add({
            name: '线几何对象',
            polyline: {
                positions: positions,
                width: 5.0,
                material: new Cesium.PolylineGlowMaterialProperty({
                    // eslint-disable-next-line new-cap
                    color: Cesium.Color.WHEAT
                }),
                depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
                    // eslint-disable-next-line new-cap
                    color: Cesium.Color.WHEAT
                }),
                clampToGround: true
            }
        })
    }

    const drawPolygon = (positions) => {
        if (positions.length < 2) return
        return viewer.entities.add({
            name: '面几何对象',
            polygon: {
                hierarchy: positions,
                // eslint-disable-next-line new-cap
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.WHEAT.withAlpha(0.4)
                )
            }
        })
    }

    /* 空间两点距离计算函数 */
    const getLength = (start, end) => {
        // 将起点与终点位置信息从笛卡尔坐标形式转换为Cartographic形式
        let startCartographic = Cesium.Cartographic.fromCartesian(start)
        let endCartographic = Cesium.Cartographic.fromCartesian(end)
        // 初始化测地线
        let geodesic = new Cesium.EllipsoidGeodesic()
        // 设置测地线起点和终点，EllipsoidGeodesic中setEndPoints常与surfaceDistance搭配使用
        geodesic.setEndPoints(startCartographic, endCartographic)
        // 获取起点和终点之间的表面距离，单位为km，规定四舍五入保留两位小数
        // surfaceDistance返回number 单位为m，带小数
        // console.log((geodesic.surfaceDistance / 1000).toFixed(2))
        return (geodesic.surfaceDistance / 1000).toFixed(2)
    }

    /* 空间两点计算中点函数 */
    const getMidpoint = (start, end) => {
        let startPoint = Cesium.Cartographic.fromCartesian(start)
        let endPoint = Cesium.Cartographic.fromCartesian(end)
        let geodesic = new Cesium.EllipsoidGeodesic()
        geodesic.setEndPoints(startPoint, endPoint)
        let geoPoint = geodesic.interpolateUsingFraction(0.5)
        console.log(Cesium.Ellipsoid.WGS84.cartographicToCartesian(geoPoint))
        return Cesium.Ellipsoid.WGS84.cartographicToCartesian(geoPoint)
    }

    const addLabel = (midPoint, labelLength) => {
        return viewer.entities.add({
            name: '中点',
            position: midPoint,
            label: {
                text: labelLength + 'km',
                font: '20px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                backgroundColor: Cesium.Color.BLACK,
                showBackground: true,
                style: Cesium.LabelStyle.FILL,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        })
    }

    const Bearing = (from, to) => {
        let fromCartographic = Cesium.Cartographic.fromCartesian(from)
        let toCartographic = Cesium.Cartographic.fromCartesian(to)
        let lat1 = fromCartographic.latitude
        let lon1 = fromCartographic.longitude
        let lat2 = toCartographic.latitude
        let lon2 = toCartographic.longitude
        let angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2))
        if (angle < 0) {
            angle += Math.PI * 2.0
        }
        return angle
    }

    // 角度
    const pointAngle = (point1, point2, point3) => {
        let bearing21 = Bearing(point2, point1)
        let bearing23 = Bearing(point2, point3)
        let angle = bearing21 - bearing23
        if (angle < 0) {
            angle += Math.PI * 2.0
        }
        return angle
    }

    const getArea = (positions) => {
        let res = 0
        for (let i = 0; i < positions.length - 2; i++) {
            let j = (i + 1) % positions.length
            let k = (i + 2) % positions.length
            let totalAngle = pointAngle(positions[i], positions[j], positions[k])
            let tempLength1 = getLength(positions[j], positions[0])
            let tempLength2 = getLength(positions[k], positions[0])
            res += tempLength1 * tempLength2 * Math.sin(totalAngle) / 2
        }
        res = res.toFixed(2)
        // console.log(res)
        res = parseFloat(res)
        // console.log(Math.abs(res))
        return Math.abs(res)
    }

    const addArea = (area, positions) => {
        return viewer.entities.add({
            name: '多边形面积',
            position: positions[positions.length - 1],
            label: {
                text: area + '平方公里',
                font: '20px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                backgroundColor: Cesium.Color.BLACK,
                showBackground: true,
                style: Cesium.LabelStyle.FILL,
                pixelOffset: new Cesium.Cartesian2(60, -60),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        })
    }

    const draw = (type) => {
        // let pointNum = this.pointNum
        // console.log(pointNum)
        let tempEntities0 = tempEntities.value
        let floatingPoint0 = floatingPoint.value
        let activeShape0 = activeShape.value
        let position = []
        let tempPoints = []
        let activeShapePoints = []
        // 开启深度检测
        viewer.scene.globe.depthTestAgainstTerrain = true
        // 创建场景的HTML canvas元素
        let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        switch (type) {
            // 绘制线
            case 'Polyline':
                // 取消鼠标双击事件
                viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
                // 监听鼠标移动
                handler.setInputAction(function (movement) {
                    if (Cesium.defined(floatingPoint0)) {
                        let newPosition = viewer.scene.pickPosition(movement.endPosition)
                        if (Cesium.defined(newPosition)) {
                            floatingPoint0.position.setValue(newPosition)
                            activeShapePoints.pop()
                            activeShapePoints.push(newPosition)
                        }
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
                // 左键单击开始画线
                handler.setInputAction(function (click) {
                    let earthPosition = viewer.scene.pickPosition(click.position)
                    if (Cesium.defined(earthPosition)) {
                        floatingPoint0 = drawPoint(earthPosition)
                    }
                    // 获取位置信息
                    // 从相机位置创建一条射线，这条射线通过世界中movement.position像素所在的坐标,返回Cartesian3坐标
                    let ray = viewer.camera.getPickRay(click.position)
                    // 找到射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3坐标
                    position = viewer.scene.globe.pick(ray, viewer.scene)
                    tempPoints.push(position) // 记录点位
                    pointNum.value += 1
                    let tempLength = tempPoints.length // 记录点数
                    // 调用绘制点的接口
                    let point = drawPointLabel(tempPoints[tempPoints.length - 1], JSON.stringify(pointNum.value))
                    tempEntities0.push(point)
                    // 存在超过一个点时
                    if (tempLength > 1) {
                        // 绘制线
                        let pointLength = getLength(tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1])
                        let midPosition = getMidpoint(tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1])
                        let pointline = drawPolyline([tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1]])
                        let pointLabel = addLabel(midPosition, pointLength)
                        tempEntities0.push(pointline) // 保存记录
                        tempEntities0.push(pointLabel)
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
                // 右键单击结束画线
                handler.setInputAction(function (click) {
                    console.log(pointNum.value)
                    activeShapePoints.pop()
                    viewer.entities.remove(activeShapePoints)
                    viewer.entities.remove(floatingPoint0)
                    tempPoints = [] // 清空点位记录
                    handler.destroy()
                    handler = null
                    floatingPoint0 = undefined
                    activeShape0 = undefined
                    activeShapePoints = []
                    console.log(pointNum.value)
                }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
                break
            // 绘制面
            case 'Polygon':
                // 取消鼠标双击事件
                viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
                // 监听鼠标移动
                handler.setInputAction(function (movement) {
                    if (Cesium.defined(floatingPoint0)) {
                        let newPosition = viewer.scene.pickPosition(movement.endPosition)
                        if (Cesium.defined(newPosition)) {
                            floatingPoint0.position.setValue(newPosition)
                            activeShapePoints.pop()
                            activeShapePoints.push(newPosition)
                        }
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
                // 左键单击开始画线
                handler.setInputAction(function (click) {
                    let earthPosition = viewer.scene.pickPosition(click.position)
                    if (Cesium.defined(earthPosition)) {
                        if (activeShapePoints.length === 0) {
                            floatingPoint0 = drawPoint(earthPosition)
                            activeShapePoints.push(earthPosition)
                            const dynamicPositions = new Cesium.CallbackProperty(function () {
                                return new Cesium.PolygonHierarchy(activeShapePoints)
                            }, false)
                            activeShape0 = drawPolygon(dynamicPositions)
                        }
                        activeShapePoints.push(earthPosition)
                    }
                    // 获取位置信息
                    let ray = viewer.camera.getPickRay(click.position)
                    position = viewer.scene.globe.pick(ray, viewer.scene)
                    tempPoints.push(position) // 记录点位
                    let tempLength = tempPoints.length // 记录点数
                    pointNum.value += 1
                    // 调用绘制点的接口
                    let point = drawPointLabel(tempPoints[tempPoints.length - 1], JSON.stringify(pointNum.value))
                    tempEntities0.push(point)
                    // 存在超过一个点时
                    if (tempLength > 1) {
                        // 绘制线
                        let pointline = drawPolyline([tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1]])
                        tempEntities0.push(pointline) // 保存记录
                    }
                }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
                // 右键单击结束画面
                handler.setInputAction(function (click) {
                    // 选择一个椭球或地图
                    let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
                    if (cartesian) {
                        let tempLength = tempPoints.length
                        if (tempLength < 3) {
                            alert('闭合操作需要至少3个点嗷')
                        } else {
                            // 闭合最后一条线
                            let pointline = drawPolyline([tempPoints[0], tempPoints[tempPoints.length - 1]])
                            tempEntities0.push(pointline)
                            drawPolygon(tempPoints)
                            let pointArea = getArea(tempPoints)
                            addArea(JSON.stringify(pointArea), tempPoints)
                            tempEntities0.push(tempPoints)
                            handler.destroy()
                            handler = null
                        }
                    }
                    activeShapePoints.pop()
                    viewer.entities.remove(activeShapePoints)
                    viewer.entities.remove(floatingPoint0)
                    floatingPoint0 = undefined
                    activeShapePoints = []
                }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
                break
        }
    }

    /* 清除实体 */
    const clearAllDrawn = () => {
        tempEntities.value = []
        pointNum.value = 0
        viewer.entities.removeAll()
    }

    return {
        draw,
        clearAllDrawn,
    }
}
