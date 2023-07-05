import * as Cesium from 'cesium'

export default class MeasureManager {
    constructor(viewer) {
        this.viewer = viewer
    }

    distance() {
        const viewer = this.viewer
        // 存储点
        const positions = []
        // 存储标签
        let label = null
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        // 注册鼠标左击事件
        handler.setInputAction(evt => {
            const cartesian = viewer.scene.pickPosition(evt.position);
            if (!cartesian) return
            positions.push(cartesian.clone())
            if (positions.length >= 2) {
                handler.destroy()
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        handler.setInputAction(evt => {
            const cartesian = viewer.scene.pickPosition(evt.endPosition);
            if (!cartesian) return
            if (positions.length >= 2) {
                positions.pop()
                positions.push(cartesian.clone())
            } else if (positions.length === 1) {
                positions.push(cartesian.clone())
                this.addLine(positions)
                label = this.addLabel(positions[0], this.getLength(positions))
            }
            if (label) {
                label.label.text.setValue(this.getLength(positions))
                label.position.setValue(positions[1])
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        handler.setInputAction(evt => {
            handler.destroy()
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }

    addLine(positions) {
        const viewer = this.viewer
        viewer.entities.add(
            new Cesium.Entity({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => positions, false),
                    width: 2,
                    material: Cesium.Color.YELLOW,
                    clampToGround: true,
                }
            })
        )
    }

    addLabel(point, text) {
        const viewer = this.viewer
        return viewer.entities.add(
            new Cesium.Entity({
                position: point,
                label: {
                    text: text,
                    font: '14px sans-serif',
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                    fillColor: Cesium.Color.YELLOW,
                    showBackground: true, //指定标签后面背景的可见性
                    backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // 背景颜色
                    backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
                    pixelOffset: new Cesium.Cartesian2(0, -25),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            })
        )
    }

    getLength(points) {
        // 计算距离
        let length = Cesium.Cartesian3.distance(points[0], points[1]);
        if (length > 1000) {
            length = `${(length / 1000).toFixed(2)}km`
        } else {
            length = `${length.toFixed(2)}m`
        }
        return length
    }
}
