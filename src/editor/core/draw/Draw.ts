import { version } from '../../../../package.json'
import { ZERO } from '../../dataset/constant/Common'
import { RowFlex } from '../../dataset/enum/Row'
import {
  IAppendElementListOption,
  IComputeRowListPayload,
  IDrawFloatPayload,
  IDrawOption,
  IDrawPagePayload,
  IDrawRowPayload,
  IGetImageOption,
  IGetOriginValueOption,
  IGetValueOption,
  IPainterOption
} from '../../interface/Draw'
import {
  IEditorData,
  IEditorOption,
  IEditorResult,
  ISetValueOption
} from '../../interface/Editor'
import {
  IElement,
  IElementMetrics,
  IElementFillRect,
  IElementStyle,
  ISpliceElementListOption,
  IInsertElementListOption
} from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import { IColumnLayout, IColumnOption } from '../../interface/Column'
import { ColumnManager } from './column/ColumnManager'
import { deepClone, getUUID, nextTick } from '../../utils'
import { Cursor } from '../cursor/Cursor'
import { CanvasEvent } from '../event/CanvasEvent'
import { GlobalEvent } from '../event/GlobalEvent'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { Background } from './frame/Background'
import { Highlight } from './richtext/Highlight'
import { Margin } from './frame/Margin'
import { Search } from './interactive/Search'
import { Strikeout } from './richtext/Strikeout'
import { Underline } from './richtext/Underline'
import { ElementType } from '../../dataset/enum/Element'
import { ImageParticle } from './particle/ImageParticle'
import { LaTexParticle } from './particle/latex/LaTexParticle'
import { TextParticle } from './particle/TextParticle'
import { PageNumber } from './frame/PageNumber'
import { ScrollObserver } from '../observer/ScrollObserver'
import { SelectionObserver } from '../observer/SelectionObserver'
import { TableParticle } from './particle/table/TableParticle'
import { TableTool } from './particle/table/TableTool'
import { HyperlinkParticle } from './particle/HyperlinkParticle'
import { LabelParticle } from './particle/LabelParticle'
import { Header } from './frame/Header'
import { SuperscriptParticle } from './particle/SuperscriptParticle'
import { SubscriptParticle } from './particle/SubscriptParticle'
import { SeparatorParticle } from './particle/SeparatorParticle'
import { PageBreakParticle } from './particle/PageBreakParticle'
import { Watermark } from './frame/Watermark'
import { WatermarkLayer } from '../../dataset/enum/Watermark'
import {
  EditorComponent,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection,
  WordBreak
} from '../../dataset/enum/Editor'
import { Control } from './control/Control'
import {
  deleteSurroundElementList,
  formatElementList,
  getAnchorElement,
  getIsBlockElement,
  getSlimCloneElementList,
  pickSurroundElementList,
  zipElementList
} from '../../utils/element'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { RadioParticle } from './particle/RadioParticle'
import { DeepRequired, IPadding } from '../../interface/Common'
import {
  ControlComponent,
  ControlIndentation
} from '../../dataset/enum/Control'
import { WorkerManager } from '../worker/WorkerManager'
import { Previewer } from './particle/previewer/Previewer'
import { DateParticle } from './particle/date/DateParticle'
import { IMargin } from '../../interface/Margin'
import { BlockParticle } from './particle/block/BlockParticle'
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { I18n } from '../i18n/I18n'
import { ImageObserver } from '../observer/ImageObserver'
import { Zone } from '../zone/Zone'
import { Footer } from './frame/Footer'
import {
  IMAGE_ELEMENT_TYPE,
  TEXTLIKE_ELEMENT_TYPE
} from '../../dataset/constant/Element'
import { ListParticle } from './particle/ListParticle'
import { Placeholder } from './frame/Placeholder'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { Group } from './interactive/Group'
import { Override } from '../override/Override'
import { FlexDirection, ImageDisplay } from '../../dataset/enum/Common'
import {
  PUNCTUATION_REG,
  WHITE_SPACE_REG
} from '../../dataset/constant/Regular'
import { LineBreakParticle } from './particle/LineBreakParticle'
import { WhiteSpaceParticle } from './particle/WhiteSpaceParticle'
import { MouseObserver } from '../observer/MouseObserver'
import { LineNumber } from './frame/LineNumber'
import { PageBorder } from './frame/PageBorder'
import { ITd } from '../../interface/table/Td'
import { Actuator } from '../actuator/Actuator'
import { TableOperate } from './particle/table/TableOperate'
import { Area } from './interactive/Area'
import { Badge } from './frame/Badge'
import { Graffiti } from './graffiti/Graffiti'
import { Magnifier } from './interactive/Magnifier'
import { Accessibility } from '../accessibility/Accessibility'
import { ITr } from '../../interface/table/Tr'
import { IPositionContext } from '../../interface/Position'
import { IControl } from '../../interface/Control'

interface FindTableChildrenElementRes {
  originalIndex: number
  table: IElement
  tr: ITr
  trIndex: number
  td: ITd
  tdIndex: number
  elementIndex: number
}

export class Draw {
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private renderCount: number
  private pagePixelRatio: number | null
  private mode: EditorMode
  private options: DeepRequired<IEditorOption>
  private position: Position
  private zone: Zone
  private elementList: IElement[]
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private override: Override

  private i18n: I18n
  private canvasEvent: CanvasEvent
  private globalEvent: GlobalEvent
  private cursor: Cursor
  private range: RangeManager
  private margin: Margin
  private background: Background
  private badge: Badge
  private magnifier: Magnifier
  private search: Search
  private group: Group
  private area: Area
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private previewer: Previewer
  private imageParticle: ImageParticle
  private laTexParticle: LaTexParticle
  private textParticle: TextParticle
  private tableParticle: TableParticle
  private tableTool: TableTool
  private tableOperate: TableOperate
  private pageNumber: PageNumber
  private lineNumber: LineNumber
  private waterMark: Watermark
  private placeholder: Placeholder
  private header: Header
  private footer: Footer
  private hyperlinkParticle: HyperlinkParticle
  private labelParticle: LabelParticle
  private dateParticle: DateParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle
  private radioParticle: RadioParticle
  private blockParticle: BlockParticle
  private listParticle: ListParticle
  private lineBreakParticle: LineBreakParticle
  private whiteSpaceParticle: WhiteSpaceParticle
  private control: Control
  private pageBorder: PageBorder
  private workerManager: WorkerManager
  private scrollObserver: ScrollObserver
  private selectionObserver: SelectionObserver
  private imageObserver: ImageObserver
  private graffiti: Graffiti
  private accessibility: Accessibility

  private LETTER_REG: RegExp
  private WORD_LIKE_REG: RegExp
  private rowList: IRow[]
  private pageRowList: IRow[][]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOption | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number
  private lazyRenderIntersectionObserver: IntersectionObserver | null
  private printModeData: Required<Omit<IEditorData, 'graffiti'>> | null
  private controlMinWidthPlaceholderElementListSet: WeakSet<IElement[]>
  private columnManager: ColumnManager
  private splitTdValueMap: Map<string, IElement[]> = new Map() // 缓存拆分单元格，用于快速获取
  private tdMap: Map<string, ITd> = new Map()

  constructor(
    rootContainer: HTMLElement,
    options: DeepRequired<IEditorOption>,
    data: IEditorData,
    listener: Listener,
    eventBus: EventBus<EventBusMap>,
    override: Override
  ) {
    this.container = this._wrapContainer(rootContainer)
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
    this.renderCount = 0
    this.pagePixelRatio = null
    this.mode = options.mode
    this.options = options
    this.elementList = data.main
    this.listener = listener
    this.eventBus = eventBus
    this.override = override

    this._formatContainer()
    this.pageContainer = this._createPageContainer()
    this._createPage(0)

    this.i18n = new I18n(options.locale)
    this.historyManager = new HistoryManager(this)
    this.position = new Position(this)
    this.zone = new Zone(this)
    this.range = new RangeManager(this)
    this.margin = new Margin(this)
    this.background = new Background(this)
    this.badge = new Badge(this)
    this.magnifier = new Magnifier(this)
    this.search = new Search(this)
    this.group = new Group(this)
    this.area = new Area(this)
    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.previewer = new Previewer(this)
    this.imageParticle = new ImageParticle(this)
    this.laTexParticle = new LaTexParticle(this)
    this.textParticle = new TextParticle(this)
    this.tableParticle = new TableParticle(this)
    this.tableTool = new TableTool(this)
    this.tableOperate = new TableOperate(this)
    this.pageNumber = new PageNumber(this)
    this.lineNumber = new LineNumber(this)
    this.waterMark = new Watermark(this)
    this.placeholder = new Placeholder(this)
    this.header = new Header(this, data.header)
    this.footer = new Footer(this, data.footer)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.labelParticle = new LabelParticle(this)
    this.dateParticle = new DateParticle(this)
    this.separatorParticle = new SeparatorParticle(this)
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
    this.radioParticle = new RadioParticle(this)
    this.blockParticle = new BlockParticle(this)
    this.listParticle = new ListParticle(this)
    this.lineBreakParticle = new LineBreakParticle(this)
    this.whiteSpaceParticle = new WhiteSpaceParticle(this)
    this.control = new Control(this)
    this.pageBorder = new PageBorder(this)
    this.graffiti = new Graffiti(this, data.graffiti)
    this.columnManager = new ColumnManager(this)

    this.scrollObserver = new ScrollObserver(this)
    this.selectionObserver = new SelectionObserver(this)
    this.imageObserver = new ImageObserver()
    new MouseObserver(this)

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    this.globalEvent = new GlobalEvent(this, this.canvasEvent)
    this.globalEvent.register()

    this.workerManager = new WorkerManager(this)
    new Actuator(this)
    this.accessibility = new Accessibility(this)

    const { letterClass } = options
    this.LETTER_REG = new RegExp(`[${letterClass.join('')}]`)
    this.WORD_LIKE_REG = new RegExp(
      `${letterClass.map(letter => `[^${letter}][${letter}]`).join('|')}`
    )
    this.rowList = []
    this.pageRowList = []
    this.painterStyle = null
    this.painterOptions = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0
    this.lazyRenderIntersectionObserver = null
    this.printModeData = null
    this.controlMinWidthPlaceholderElementListSet = new WeakSet()

    // 打印模式优先设置打印数据
    if (this.mode === EditorMode.PRINT) {
      this.setPrintData()
    }
    this.render({
      isInit: true,
      isSetCursor: false,
      isFirstRender: true
    })
  }

  // 设置打印数据
  public setPrintData() {
    this.printModeData = {
      header: this.header.getElementList(),
      main: this.elementList,
      footer: this.footer.getElementList()
    }
    // 过滤控件辅助元素
    const clonePrintModeData = deepClone(this.printModeData)
    const editorDataKeys: (keyof Omit<IEditorData, 'graffiti'>)[] = [
      'header',
      'main',
      'footer'
    ]
    editorDataKeys.forEach(key => {
      clonePrintModeData[key] = this.control.filterAssistElement(
        clonePrintModeData[key]
      )
    })
    this.setEditorData(clonePrintModeData)
  }

  // 还原打印数据
  public clearPrintData() {
    if (this.printModeData) {
      this.setEditorData(this.printModeData)
      this.printModeData = null
    }
  }

  public getLetterReg(): RegExp {
    return this.LETTER_REG
  }

  public getMode(): EditorMode {
    return this.mode
  }

  public setMode(payload: EditorMode) {
    if (this.mode === payload) return
    // 设置打印模式
    if (payload === EditorMode.PRINT) {
      this.setPrintData()
    }
    // 取消打印模式
    if (this.mode === EditorMode.PRINT) {
      this.clearPrintData()
    }
    this.clearSideEffect()
    this.range.clearRange()
    this.mode = payload
    this.options.mode = payload
    this.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public isReadonly() {
    if (this.area.getActiveAreaInfo()?.area?.mode) {
      return this.area.isReadonly()
    }
    switch (this.mode) {
      case EditorMode.DESIGN:
        return false
      case EditorMode.READONLY:
      case EditorMode.PRINT:
      case EditorMode.GRAFFITI:
        return true
      case EditorMode.FORM:
        return !this.control.getIsRangeWithinControl()
      default:
        return false
    }
  }

  public isDisabled() {
    if (this.mode === EditorMode.DESIGN) return false
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.getElementList()
    // 优先判断表格单元格
    if (this.getTd()?.disabled) return true
    if (startIndex === endIndex) {
      const startElement = elementList[startIndex]
      const nextElement = elementList[startIndex + 1]
      return !!(
        (startElement?.title?.disabled &&
          nextElement?.title?.disabled &&
          startElement.titleId === nextElement.titleId) ||
        (startElement?.control?.disabled &&
          nextElement?.control?.disabled &&
          startElement.controlId === nextElement.controlId)
      )
    }
    const selectionElementList = elementList.slice(startIndex + 1, endIndex + 1)
    return selectionElementList.some(
      element => element.title?.disabled || element.control?.disabled
    )
  }

  public isDesignMode() {
    return this.mode === EditorMode.DESIGN
  }

  public isPrintMode() {
    return this.mode === EditorMode.PRINT
  }

  public isAreaHideDisabled() {
    return (
      this.isDesignMode() ||
      (this.isPrintMode() &&
        this.options.modeRule[EditorMode.PRINT].areaHideDisabled)
    )
  }

  public isGraffitiMode() {
    return this.mode === EditorMode.GRAFFITI
  }

  public getOriginalWidth(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? width : height
  }

  public getOriginalHeight(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? height : width
  }

  public getWidth(): number {
    return Math.floor(this.getOriginalWidth() * this.options.scale)
  }

  public getHeight(): number {
    return Math.floor(this.getOriginalHeight() * this.options.scale)
  }

  public getMainHeight(): number {
    const pageHeight = this.getHeight()
    return pageHeight - this.getMainOuterHeight()
  }

  public getMainOuterHeight(pageNo?: number): number {
    const margins = this.getMargins()
    const headerExtraHeight = this.header.getExtraHeight(pageNo)
    const footerExtraHeight = this.footer.getExtraHeight(pageNo)
    return margins[0] + margins[2] + headerExtraHeight + footerExtraHeight
  }

  public getCanvasWidth(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.width
  }

  public getCanvasHeight(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.height
  }

  public getInnerWidth(): number {
    const width = this.getWidth()
    const margins = this.getMargins()
    return width - margins[1] - margins[3]
  }

  public getColumnLayout(): IColumnLayout | null {
    return this.columnManager.getLayout()
  }

  public setColumnConfig(config: IColumnOption | null): void {
    if (this.options.pageMode === PageMode.CONTINUITY) return
    this.columnManager.setConfig(config)
  }

  public getOriginalInnerWidth(): number {
    const width = this.getOriginalWidth()
    const margins = this.getOriginalMargins()
    return width - margins[1] - margins[3]
  }

  public getContextInnerWidth(): number {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      const elementList = this.getOriginalElementList()
      const td = elementList[index!].trList![trIndex!].tdList[tdIndex!]
      const tdPadding = this.getTdPadding()
      return td!.width! - tdPadding[1] - tdPadding[3]
    }
    return this.getOriginalInnerWidth()
  }

  public getMargins(): IMargin {
    return <IMargin>this.getOriginalMargins().map(m => m * this.options.scale)
  }

  public getOriginalMargins(): number[] {
    const { margins, paperDirection } = this.options
    return paperDirection === PaperDirection.VERTICAL
      ? margins
      : [margins[1], margins[2], margins[3], margins[0]]
  }

  public getPageGap(): number {
    return this.options.pageGap * this.options.scale
  }

  public getOriginalPageGap(): number {
    return this.options.pageGap
  }

  public getPageNumberBottom(): number {
    const {
      pageNumber: { bottom },
      scale
    } = this.options
    return bottom * scale
  }

  public getMarginIndicatorSize(): number {
    return this.options.marginIndicatorSize * this.options.scale
  }

  public getDefaultBasicRowMarginHeight(): number {
    return this.options.defaultBasicRowMarginHeight * this.options.scale
  }

  public getHighlightMarginHeight(): number {
    return this.options.highlightMarginHeight * this.options.scale
  }

  public getTdPadding(): IPadding {
    const {
      table: { tdPadding },
      scale
    } = this.options
    return <IPadding>tdPadding.map(m => m * scale)
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public getPageContainer(): HTMLDivElement {
    return this.pageContainer
  }

  public getVisiblePageNoList(): number[] {
    return this.visiblePageNoList
  }

  public setVisiblePageNoList(payload: number[]) {
    this.visiblePageNoList = payload
    if (this.listener.visiblePageNoListChange) {
      this.listener.visiblePageNoListChange(this.visiblePageNoList)
    }
    if (this.eventBus.isSubscribe('visiblePageNoListChange')) {
      this.eventBus.emit('visiblePageNoListChange', this.visiblePageNoList)
    }
  }

  public getIntersectionPageNo(): number {
    return this.intersectionPageNo
  }

  public setIntersectionPageNo(payload: number) {
    this.intersectionPageNo = payload
    if (this.listener.intersectionPageNoChange) {
      this.listener.intersectionPageNoChange(this.intersectionPageNo)
    }
    if (this.eventBus.isSubscribe('intersectionPageNoChange')) {
      this.eventBus.emit('intersectionPageNoChange', this.intersectionPageNo)
    }
  }

  public getPageNo(): number {
    return this.pageNo
  }

  public setPageNo(payload: number) {
    this.pageNo = payload
  }

  public getRenderCount(): number {
    return this.renderCount
  }

  public getPage(pageNo = -1): HTMLCanvasElement {
    return this.pageList[~pageNo ? pageNo : this.pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getPageCount(): number {
    return this.pageList.length
  }

  public getTableRowList(sourceElementList: IElement[]): IRow[] {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex } = positionContext
    return sourceElementList[index!].trList![trIndex!].tdList[tdIndex!].rowList!
  }

  public getOriginalRowList() {
    const zoneManager = this.getZone()
    if (zoneManager.isHeaderActive()) {
      return this.header.getRowList()
    }
    if (zoneManager.isFooterActive()) {
      return this.footer.getRowList()
    }
    return this.rowList
  }

  public getRowList(): IRow[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableRowList(this.getOriginalElementList())
      : this.getOriginalRowList()
  }

  public getPageRowList(): IRow[][] {
    return this.pageRowList
  }

  public getCtx(): CanvasRenderingContext2D {
    return this.ctxList[this.pageNo]
  }

  public getOptions(): DeepRequired<IEditorOption> {
    return this.options
  }

  public getSearch(): Search {
    return this.search
  }

  public getGroup(): Group {
    return this.group
  }

  public getArea(): Area {
    return this.area
  }

  public getBadge(): Badge {
    return this.badge
  }

  public getMagnifier(): Magnifier {
    return this.magnifier
  }

  public getHistoryManager(): HistoryManager {
    return this.historyManager
  }

  public getPosition(): Position {
    return this.position
  }

  public getZone(): Zone {
    return this.zone
  }

  public getColumnManager(): ColumnManager {
    return this.columnManager
  }

  public getRange(): RangeManager {
    return this.range
  }

  public getLineBreakParticle(): LineBreakParticle {
    return this.lineBreakParticle
  }

  public getTextParticle(): TextParticle {
    return this.textParticle
  }

  public getHeaderElementList(): IElement[] {
    return this.header.getElementList()
  }

  public getTableElementList(sourceElementList: IElement[]): IElement[] {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex } = positionContext
    if (index === undefined || trIndex === undefined || tdIndex === undefined) {
      return []
    }
    const table = sourceElementList[index]
    if (!table?.trList) {
      return []
    }
    const tr = table.trList[trIndex]
    if (!tr?.tdList) {
      return []
    }
    return tr.tdList[tdIndex]?.value || []
  }

  public getElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    const elementList = this.getOriginalElementList()
    return positionContext.isTable
      ? this.getTableElementList(elementList)
      : elementList
  }

  public getMainElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableElementList(this.elementList)
      : this.elementList
  }

  public getOriginalElementList() {
    const zoneManager = this.getZone()
    if (zoneManager.isHeaderActive()) {
      return this.getHeaderElementList()
    }
    if (zoneManager.isFooterActive()) {
      return this.getFooterElementList()
    }
    return this.elementList
  }

  public getOriginalMainElementList(): IElement[] {
    return this.elementList
  }

  public getFooterElementList(): IElement[] {
    return this.footer.getElementList()
  }

  public getTd(): ITd | null {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex, isTable } = positionContext
    if (!isTable || index === undefined || trIndex === undefined || tdIndex === undefined) {
      return null
    }
    const elementList = this.getOriginalElementList()
    const table = elementList[index]
    if (!table?.trList) {
      return null
    }
    const tr = table.trList[trIndex]
    if (!tr?.tdList) {
      return null
    }
    return tr.tdList[tdIndex] || null
  }

  public insertElementList(
    payload: IElement[],
    options: IInsertElementListOption = {}
  ) {
    if (!payload.length || !this.range.getIsCanInput()) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { isSubmitHistory = true } = options
    formatElementList(payload, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    let curIndex = -1
    // 判断是否在控件内
    let activeControl = this.control.getActiveControl()
    // 光标在控件内如果当前没有被激活，需要手动激活
    if (!activeControl && this.control.getIsRangeWithinControl()) {
      this.control.initControl()
      activeControl = this.control.getActiveControl()
    }
    if (activeControl && this.control.getIsRangeWithinControl()) {
      curIndex = activeControl.setValue(payload, undefined, {
        isIgnoreDisabledRule: true
      })
      this.control.emitControlContentChange()
    } else {
      const elementList = this.getElementList()
      const isCollapsed = startIndex === endIndex
      const start = startIndex + 1
      if (!isCollapsed) {
        this.spliceElementList(elementList, start, endIndex - startIndex)
      }
      this.spliceElementList(elementList, start, 0, payload)
      curIndex = startIndex + payload.length
      // 列表前如有换行符则删除-因为列表内已存在
      const preElement = elementList[start - 1]
      if (
        payload[0].listId &&
        preElement &&
        !preElement.listId &&
        preElement?.value === ZERO &&
        (!preElement.type || preElement.type === ElementType.TEXT)
      ) {
        elementList.splice(startIndex, 1)
        curIndex -= 1
      }
    }
    if (~curIndex) {
      this.range.setRange(curIndex, curIndex)
      this.render({
        curIndex,
        isSubmitHistory
      })
    }
  }

  public appendElementList(
    elementList: IElement[],
    options: IAppendElementListOption = {}
  ) {
    if (!elementList.length) return
    formatElementList(elementList, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    let curIndex: number
    const { isPrepend, isSubmitHistory = true } = options
    if (isPrepend) {
      this.elementList.splice(1, 0, ...elementList)
      curIndex = elementList.length
    } else {
      this.elementList.push(...elementList)
      curIndex = this.elementList.length - 1
    }
    this.range.setRange(curIndex, curIndex)
    this.render({
      curIndex,
      isSubmitHistory
    })
  }

  public spliceElementList(
    elementList: IElement[],
    start: number,
    deleteCount: number,
    items?: IElement[],
    options?: ISpliceElementListOption
  ) {
    const { isIgnoreDeletedRule = false } = options || {}
    const { group, modeRule } = this.options
    if (deleteCount > 0) {
      // 当最后元素与开始元素列表信息不一致时：清除当前列表信息
      const endIndex = start + deleteCount
      const endElement = elementList[endIndex]
      const endElementListId = endElement?.listId
      if (
        endElementListId &&
        elementList[start - 1]?.listId !== endElementListId
      ) {
        let startIndex = endIndex
        while (startIndex < elementList.length) {
          const curElement = elementList[startIndex]
          if (
            curElement.listId !== endElementListId ||
            curElement.value === ZERO
          ) {
            break
          }
          delete curElement.listId
          delete curElement.listType
          delete curElement.listStyle
          startIndex++
        }
      }
      // 非明确忽略删除规则 && 非设计模式 && 非光标在控件内(控件内控制) =》 校验删除规则
      if (
        !isIgnoreDeletedRule &&
        !this.isDesignMode() &&
        !this.control.getIsRangeWithinControl()
      ) {
        const tdDeletable = this.getTd()?.deletable
        let deleteIndex = endIndex - 1
        while (deleteIndex >= start) {
          const deleteElement = elementList[deleteIndex]
          if (
            deleteElement?.hide ||
            deleteElement?.control?.hide ||
            deleteElement?.area?.hide ||
            (tdDeletable !== false &&
              deleteElement?.control?.deletable !== false &&
              (!deleteElement.controlId ||
                this.mode !== EditorMode.FORM ||
                !modeRule[this.mode].controlDeletableDisabled) &&
              deleteElement?.title?.deletable !== false &&
              (group.deletable !== false || !deleteElement.groupIds?.length) &&
              (deleteElement?.area?.deletable !== false ||
                deleteElement?.areaIndex !== 0))
          ) {
            elementList.splice(deleteIndex, 1)
          }
          deleteIndex--
        }
      } else {
        elementList.splice(start, deleteCount)
      }
    }
    // 循环添加，避免使用解构影响性能
    if (items?.length) {
      for (let i = 0; i < items.length; i++) {
        elementList.splice(start + i, 0, items[i])
      }
    }
  }

  public getCanvasEvent(): CanvasEvent {
    return this.canvasEvent
  }

  public getGlobalEvent(): GlobalEvent {
    return this.globalEvent
  }

  public getListener(): Listener {
    return this.listener
  }

  public getEventBus(): EventBus<EventBusMap> {
    return this.eventBus
  }

  public getOverride(): Override {
    return this.override
  }

  public getCursor(): Cursor {
    return this.cursor
  }

  public getPreviewer(): Previewer {
    return this.previewer
  }

  public getImageParticle(): ImageParticle {
    return this.imageParticle
  }

  public getTableTool(): TableTool {
    return this.tableTool
  }

  public getTableOperate(): TableOperate {
    return this.tableOperate
  }

  public getTableParticle(): TableParticle {
    return this.tableParticle
  }

  public getBlockParticle(): BlockParticle {
    return this.blockParticle
  }

  public getHeader(): Header {
    return this.header
  }

  public getFooter(): Footer {
    return this.footer
  }

  public getHyperlinkParticle(): HyperlinkParticle {
    return this.hyperlinkParticle
  }

  public getDateParticle(): DateParticle {
    return this.dateParticle
  }

  public getListParticle(): ListParticle {
    return this.listParticle
  }

  public getCheckboxParticle(): CheckboxParticle {
    return this.checkboxParticle
  }

  public getRadioParticle(): RadioParticle {
    return this.radioParticle
  }

  public getControl(): Control {
    return this.control
  }

  public getWorkerManager(): WorkerManager {
    return this.workerManager
  }

  public getImageObserver(): ImageObserver {
    return this.imageObserver
  }

  public getI18n(): I18n {
    return this.i18n
  }

  public getGraffiti(): Graffiti {
    return this.graffiti
  }

  public getAccessibility(): Accessibility {
    return this.accessibility
  }

  public getRowCount(): number {
    return this.getRowList().length
  }

  public async getDataURL(payload: IGetImageOption = {}): Promise<string[]> {
    const { pixelRatio, mode, snapDomFunction } = payload
    // 放大像素比
    if (pixelRatio) {
      this.setPagePixelRatio(pixelRatio)
    }
    // 不同模式
    const currentMode = this.mode
    const isSwitchMode = !!mode && currentMode !== mode
    if (isSwitchMode) {
      this.setMode(mode)
    }
    this.render({
      isLazy: false,
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    await this.imageObserver.allSettled()
    // 叠加iframe图片
    if (snapDomFunction) {
      await this.blockParticle.drawIframeToPage(this.pageList, snapDomFunction)
    }
    const dataUrlList = this.pageList.map(c => c.toDataURL())
    // 还原
    if (pixelRatio) {
      this.setPagePixelRatio(null)
    }
    if (isSwitchMode) {
      this.setMode(currentMode)
    }
    return dataUrlList
  }

  public getPainterStyle(): IElementStyle | null {
    return this.painterStyle && Object.keys(this.painterStyle).length
      ? this.painterStyle
      : null
  }

  public getPainterOptions(): IPainterOption | null {
    return this.painterOptions
  }

  public setPainterStyle(
    payload: IElementStyle | null,
    options?: IPainterOption
  ) {
    this.painterStyle = payload
    this.painterOptions = options || null
    if (this.getPainterStyle()) {
      this.pageList.forEach(c => (c.style.cursor = 'copy'))
    }
  }

  public setDefaultRange() {
    if (!this.elementList.length) return
    setTimeout(() => {
      const curIndex = this.elementList.length - 1
      this.range.setRange(curIndex, curIndex)
      this.range.setRangeStyle()
    })
  }

  public getIsPagingMode(): boolean {
    return this.options.pageMode === PageMode.PAGING
  }

  public setPageMode(payload: PageMode) {
    if (!payload || this.options.pageMode === payload) return
    this.options.pageMode = payload
    // 纸张大小重置
    if (payload === PageMode.PAGING) {
      const { height } = this.options
      const dpr = this.getPagePixelRatio()
      const canvas = this.pageList[0]
      canvas.style.height = `${height}px`
      canvas.height = height * dpr
      // canvas尺寸发生变化，上下文被重置
      this._initPageContext(this.ctxList[0])
    } else {
      // 连页模式：移除懒加载监听&清空页眉页脚计算数据
      this._disconnectLazyRender()
      this.header.recovery()
      this.footer.recovery()
      this.zone.setZone(EditorZone.MAIN)
    }
    const { startIndex } = this.range.getRange()
    const isCollapsed = this.range.getIsCollapsed()
    this.render({
      isSetCursor: true,
      curIndex: startIndex,
      isSubmitHistory: false
    })
    // 重新定位避免事件监听丢失
    if (!isCollapsed) {
      this.cursor.drawCursor({
        isShow: false
      })
    }
    // 回调
    setTimeout(() => {
      if (this.listener.pageModeChange) {
        this.listener.pageModeChange(payload)
      }
      if (this.eventBus.isSubscribe('pageModeChange')) {
        this.eventBus.emit('pageModeChange', payload)
      }
    })
  }

  public setPageScale(payload: number) {
    const dpr = this.getPagePixelRatio()
    this.options.scale = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      p.style.marginBottom = `${this.getPageGap()}px`
      this._initPageContext(this.ctxList[i])
    })
    const cursorPosition = this.position.getCursorPosition()
    this.render({
      isSubmitHistory: false,
      isSetCursor: !!cursorPosition,
      curIndex: cursorPosition?.index
    })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
    if (this.eventBus.isSubscribe('pageScaleChange')) {
      this.eventBus.emit('pageScaleChange', payload)
    }
  }

  public getPagePixelRatio(): number {
    return this.pagePixelRatio || window.devicePixelRatio
  }

  public setPagePixelRatio(payload: number | null) {
    if (
      (!this.pagePixelRatio && payload === window.devicePixelRatio) ||
      payload === this.pagePixelRatio
    ) {
      return
    }
    this.pagePixelRatio = payload
    this.setPageDevicePixel()
  }

  public setPageDevicePixel() {
    const dpr = this.getPagePixelRatio()
    const width = this.getWidth()
    const height = this.getHeight()
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperSize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    const dpr = this.getPagePixelRatio()
    const realWidth = this.getWidth()
    const realHeight = this.getHeight()
    this.container.style.width = `${realWidth}px`
    this.pageList.forEach((p, i) => {
      p.width = realWidth * dpr
      p.height = realHeight * dpr
      p.style.width = `${realWidth}px`
      p.style.height = `${realHeight}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperDirection(payload: PaperDirection) {
    const dpr = this.getPagePixelRatio()
    this.options.paperDirection = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperMargin(payload: IMargin) {
    this.options.margins = payload
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public getOriginValue(
    options: IGetOriginValueOption = {}
  ): Required<IEditorData> {
    const { pageNo } = options
    let mainElementList = this.elementList
    if (
      Number.isInteger(pageNo) &&
      pageNo! >= 0 &&
      pageNo! < this.pageRowList.length
    ) {
      mainElementList = this.pageRowList[pageNo!].flatMap(
        row => row.elementList
      )
    }
    // 同步block的最新数据
    this.blockParticle.update()
    const data: Required<IEditorData> = {
      header: this.getHeaderElementList(),
      main: mainElementList,
      footer: this.getFooterElementList(),
      graffiti: this.graffiti.getValue()
    }
    return data
  }

  public getValue(options: IGetValueOption = {}): IEditorResult {
    const originData = this.getOriginValue(options)
    const { extraPickAttrs } = options
    const data: IEditorData = {
      header: zipElementList(originData.header, {
        extraPickAttrs
      }),
      main: zipElementList(originData.main, {
        extraPickAttrs,
        isClassifyArea: true
      }),
      footer: zipElementList(originData.footer, {
        extraPickAttrs
      }),
      graffiti: originData.graffiti
    }
    return {
      version,
      data,
      options: deepClone(this.options)
    }
  }

  public setValue(payload: Partial<IEditorData>, options?: ISetValueOption) {
    const { header, main, footer } = deepClone(payload)
    if (!header && !main && !footer) return
    const { isSetCursor = false } = options || {}
    const pageComponentData = [header, main, footer]
    pageComponentData.forEach(data => {
      if (!data) return
      formatElementList(data, {
        editorOptions: this.options,
        isForceCompensation: true
      })
    })
    this.setEditorData({
      header,
      main,
      footer
    })
    // 渲染&计算&清空历史记录
    this.historyManager.recovery()
    const curIndex = isSetCursor
      ? main?.length
        ? main.length - 1
        : 0
      : undefined
    if (curIndex !== undefined) {
      this.range.setRange(curIndex, curIndex)
    }
    this.render({
      curIndex,
      isSetCursor,
      isFirstRender: true
    })
  }

  public setEditorData(payload: Partial<Omit<IEditorData, 'graffiti'>>) {
    const { header, main, footer } = payload
    if (header) {
      this.header.setElementList(header)
    }
    if (main) {
      this.elementList = main
    }
    if (footer) {
      this.footer.setElementList(footer)
    }
  }

  private _wrapContainer(rootContainer: HTMLElement): HTMLDivElement {
    const container = document.createElement('div')
    rootContainer.append(container)
    return container
  }

  private _formatContainer() {
    // 容器宽度需跟随纸张宽度
    this.container.style.position = 'relative'
    this.container.style.width = `${this.getWidth()}px`
    this.container.setAttribute(EDITOR_COMPONENT, EditorComponent.MAIN)
  }

  private _createPageContainer(): HTMLDivElement {
    const pageContainer = document.createElement('div')
    pageContainer.classList.add(`${EDITOR_PREFIX}-page-container`)
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const width = this.getWidth()
    const height = this.getHeight()
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.display = 'block'
    canvas.style.backgroundColor = '#ffffff'
    canvas.style.marginBottom = `${this.getPageGap()}px`
    canvas.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(canvas)
    // 调整分辨率
    const dpr = this.getPagePixelRatio()
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    // 初始化上下文配置
    this._initPageContext(ctx)
    // 缓存上下文
    this.pageList.push(canvas)
    this.ctxList.push(ctx)
  }

  private _initPageContext(ctx: CanvasRenderingContext2D) {
    const dpr = this.getPagePixelRatio()
    ctx.scale(dpr, dpr)
    // 重置以下属性是因部分浏览器(chrome)会应用css样式
    ctx.letterSpacing = '0px'
    ctx.wordSpacing = '0px'
    ctx.direction = 'ltr'
  }

  public getElementFont(el: IElement, scale = 1): string {
    const { defaultSize, defaultFont } = this.options
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${
      size * scale
    }px ${font}`
  }

  public getElementSize(el: IElement) {
    return el.actualSize || el.size || this.options.defaultSize
  }

  public getElementRowMargin(el: IElement) {
    const {
      defaultSize,
      defaultBasicRowMarginHeight,
      defaultRowMargin,
      scale
    } = this.options
    // 字体在12-30之间，行间距不变，小于12按比例缩小，大于30按比例放大
    const fontSize = el.size || defaultSize
    let ratio = 1
    if (fontSize < 12) {
      ratio = fontSize / 12
    } else if (fontSize > 30) {
      ratio = 1 + (fontSize - 30) / 30
    }
    return (
      defaultBasicRowMarginHeight *
      ratio *
      (el.rowMargin ?? defaultRowMargin) *
      scale
    )
  }

  public computeRowList(payload: IComputeRowListPayload) {
    const {
      innerWidth,
      elementList,
      isPagingMode = false,
      isFromTable = false,
      startX = 0,
      startY = 0,
      pageHeight = 0,
      mainOuterHeight = 0,
      surroundElementList = []
    } = payload
    const {
      defaultSize,
      scale,
      imgCaption,
      table: { tdPadding, defaultTrMinHeight },
      defaultTabWidth
    } = this.options
    const defaultBasicRowMarginHeight = this.getDefaultBasicRowMarginHeight()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 还原最小宽度控件占位
    if (this.controlMinWidthPlaceholderElementListSet.has(elementList)) {
      for (let i = elementList.length - 1; i >= 0; i--) {
        if (elementList[i].isControlMinWidthPlaceholder) {
          elementList.splice(i, 1)
        }
      }
      this.controlMinWidthPlaceholderElementListSet.delete(elementList)
    }
    // 计算列表偏移宽度
    const listStyleMap = this.listParticle.computeListStyle(ctx, elementList)
    const rowList: IRow[] = []
    const layout =
      isPagingMode && !isFromTable ? this.columnManager.getLayout() : null
    const isColumnEnabled = !!layout && layout.count > 1
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        startIndex: 0,
        rowIndex: 0,
        rowFlex: elementList?.[0]?.rowFlex || elementList?.[1]?.rowFlex,
        ...(isColumnEnabled ? { columnIndex: 0 } : {})
      })
    }
    // 起始位置及页码计算
    let x = startX
    let y = startY
    let pageNo = 0
    // 分页模式下按页计算起始 Y（页眉/页脚禁用时该页起始位置上移）
    let pageStartY = startY
    if (isPagingMode && !isFromTable) {
      pageStartY = this.getMargins()[0] + this.getHeader().getExtraHeight(0)
      y = pageStartY
    }
    // 列表位置
    let listId: string | undefined
    let listIndex = 0
    // 控件最小宽度
    let controlRealWidth = 0
    for (let i = 0; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      this.clearElementEffect(element)
      const rowMargin = this.getElementRowMargin(element)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      // 实际可用宽度
      const offsetX =
        curRow.offsetX ||
        (element.listId && listStyleMap.get(element.listId)) ||
        0
      const rowMaxWidth = isColumnEnabled && layout ? layout.width : innerWidth
      const availableWidth = rowMaxWidth - offsetX
      // 增加起始位置坐标偏移量
      const isStartElement = curRow.elementList.length === 1
      x += isStartElement ? offsetX : 0
      y += isStartElement ? curRow.offsetY || 0 : 0
      if (
        (element.hide ||
          element.control?.hide ||
          (element.area?.hide && !this.isAreaHideDisabled())) &&
        !this.isDesignMode()
      ) {
        const preElement = curRow.elementList[curRow.elementList.length - 1]
        metrics.height =
          preElement?.metrics.height || this.options.defaultSize * scale
        metrics.boundingBoxAscent = preElement?.metrics.boundingBoxAscent || 0
        metrics.boundingBoxDescent = preElement?.metrics.boundingBoxDescent || 0
      } else if (
        element.type === ElementType.IMAGE ||
        element.type === ElementType.LATEX
      ) {
        // 浮动图片无需计算数据
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          metrics.width = 0
          metrics.height = 0
          metrics.boundingBoxDescent = 0
        } else {
          const elementWidth = element.width! * scale
          const elementHeight = element.height! * scale
          // 图片超出尺寸后自适应（图片大小大于可用宽度时）
          if (elementWidth > availableWidth) {
            const adaptiveHeight =
              (elementHeight * availableWidth) / elementWidth
            element.width = availableWidth / scale
            element.height = adaptiveHeight / scale
            metrics.width = availableWidth
            metrics.height = adaptiveHeight
            metrics.boundingBoxDescent = adaptiveHeight
          } else {
            metrics.width = elementWidth
            metrics.height = elementHeight
            metrics.boundingBoxDescent = elementHeight
          }
          // 增加题注高度
          if (element.imgCaption?.value) {
            const fontSize = element.imgCaption.size || imgCaption.size
            const captionTop = element.imgCaption.top ?? imgCaption.top
            const captionHeight = (fontSize + captionTop) * scale
            metrics.boundingBoxAscent += captionHeight
          }
        }
      } else if (element.type === ElementType.TABLE) {
        // 表格分页处理进度：https://github.com/Hufe921/canvas-editor/issues/41
        // 查看后续表格是否属于同一个源表格-存在即合并
        if (element.pagingId) {
          const positionContext = this.position.getPositionContext()
          let tableIndex = i + 1
          let combineCount = 0
          while (tableIndex < elementList.length) {
            const nextElement = elementList[tableIndex]
            if (nextElement.pagingId === element.pagingId) {
              const nexTrList = nextElement
                .trList!.filter(tr => !tr.pagingRepeat)
                .filter(nexTr => {
                  nexTr.tdList = nexTr.tdList.filter(td => {
                    // td内容合并
                    if (td.originalId) {
                      for (
                        let trIndex = 0;
                        trIndex < element.trList!.length;
                        trIndex++
                      ) {
                        const tr = element.trList![trIndex]
                        const originalTd = tr.tdList.find(
                          ({ id }) => id === td.originalId
                        )!
                        if (originalTd) {
                          // 检查光标是否在被合并的单元格中
                          if (
                            positionContext.isTable &&
                            positionContext.tdId === td.id &&
                            positionContext.index === tableIndex
                          ) {
                            // 光标在被合并的单元格中，需要更新 range 索引
                            const offset = originalTd.value.length
                            const { startIndex, endIndex } = this.range.getRange()
                            this.range.setRange(startIndex + offset, endIndex + offset)
                            // 更新 positionContext 指向合并后的单元格
                            positionContext.index = i
                            positionContext.tdId = originalTd.id
                            positionContext.trId = tr.id
                            positionContext.tableId = element.id
                            this.position.setPositionContext(positionContext)
                          }

                          if (td.value[0]?.type === ElementType.SPLIT_TAG) {
                            // 如果第一个值是拆分单元格标记，则删除
                            td.value.splice(0, 1)
                          }
                          // 合并value
                          originalTd.value.push(
                            // 过滤拆分单元格标记
                            ...td.value
                              // 更新元素的表格信息
                              .map(val =>
                                this.updateElementTableInfo(
                                  val,
                                  element,
                                  tr,
                                  originalTd
                                )
                              )
                          )
                          // 合并拆分单元格的 rowspan
                          // 重要：originalRowspan 表示原始合并时的跨行数，用于恢复合并后的总行数

                          // 使用 originalRowspan 恢复合并后的 rowspan
                          // 如果 originalRowspan 存在，说明单元格是被拆分的，使用它来恢复
                          // 如果不存在，累加当前两段的 rowspan
                          if (td.originalRowspan !== undefined) {
                            // 保持 originalRowspan 不变
                            originalTd.rowspan = originalTd.originalRowspan ?? td.originalRowspan
                          } else {
                            // 没有 originalRowspan，说明是普通单元格，累加 rowspan
                            originalTd.rowspan = (originalTd.rowspan || 0) + (td.rowspan || 0)
                          }
                          break
                        }
                      }
                      return false
                    }
                    return true
                  })
                  // 删除空白拆分行
                  return !nexTr.originalId
                })

              element.trList!.push(...nexTrList)
              element.height! += nextElement.height!

              tableIndex++
              combineCount++
            } else {
              break
            }
          }
          if (combineCount) {
            elementList.splice(i + 1, combineCount)
          }
        }

        element.pagingIndex = element.pagingIndex ?? 0
        // 计算出表格高度
        this.tableParticle.computeTrHeight(element, (td: ITd) => {
          return this.computeRowList({
            innerWidth: (td.width! - (tdPadding[1] + tdPadding[3])) * scale,
            elementList: td.value,
            isFromTable: true,
            isPagingMode
          })
        })
        element.trList?.forEach(tr => {
          tr.tdList.forEach(td => {
            this.tdMap.set(td.id!, td)
          })
        })
        const tableHeight = this.tableParticle.getTableHeight(element)
        const tableWidth = this.tableParticle.getTableWidth(element)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth * scale
        const elementHeight = tableHeight * scale
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = -rowMargin
        // 后一个元素也是表格则移除行间距
        if (elementList[i + 1]?.type === ElementType.TABLE) {
          metrics.boundingBoxAscent -= rowMargin
        }
        // 表格分页处理(拆分表格)
        if (isPagingMode) {
          const height = this.getHeight()
          // 按表格所在页计算外部占位高度（页眉/页脚禁用时该页可用空间更大）
          const marginHeight = this.getMainOuterHeight(pageNo)
          let curPagePreHeight = marginHeight

          // 如果是拆分出来的表格（pagingIndex > 0），应该在新的一页
          // 所以 curPagePreHeight 应该从 marginHeight 开始，不需要累加前面的内容
          if (element.pagingId && element.pagingIndex && element.pagingIndex > 0) {
            // 拆分出来的表格从新页开始，curPagePreHeight 保持为 marginHeight
          } else {
            // 原始表格或非分页表格，正常计算 curPagePreHeight
            for (let r = 0; r < rowList.length; r++) {
              const row = rowList[r]
              const rowOffsetY = row.offsetY || 0
              if (
                row.height + curPagePreHeight + rowOffsetY > height ||
                rowList[r - 1]?.isPageBreak
              ) {
                curPagePreHeight = marginHeight + row.height + rowOffsetY
              } else {
                curPagePreHeight += row.height + rowOffsetY
              }
            }
          }

          // 当前剩余高度是否能容下当前表格第一行（可拆分）的高度，排除掉表头类型
          // 前面元素为换页符时重新计算高度
          const rowMarginHeight = rowMargin * 2 * scale
          const firstTrHeight = element.trList![0].height! * scale

          if (
            curPagePreHeight + firstTrHeight + rowMarginHeight > height ||
            (element.pagingIndex !== 0 && element.trList![0].pagingRepeat) ||
            elementList[i - 1]?.type === ElementType.PAGE_BREAK
          ) {
            // 无可拆分行则切换至新页
            curPagePreHeight = marginHeight
          }
          // 表格高度超过页面高度开始截断行
          // 可用高度（本页剩余空间）
          let usableHeight = height - (curPagePreHeight + rowMarginHeight)
          // 整页可用高度（一行独占一整页时的可用空间）
          const fullPageHeight = height - (marginHeight + rowMarginHeight)
          if (elementHeight > usableHeight) {
            const trList = element.trList!
            // 计算需要移除的行数
            let deleteStart = 0
            let deleteCount = 0
            let preTrHeight = 0

            // 大于一行时再拆分避免循环
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              const trHeight = tr.height * scale
              if (
                curPagePreHeight + rowMarginHeight + preTrHeight + trHeight >
                height
              ) {
                // 拆分点即当前溢出行，deleteStart 从当前行开始
                deleteStart = r
                // 需要拆分的表格行
                const originTr = tr
                // 拆分出来的表格行
                type CloneTd = ITd & { original: ITd }
                type CloneTr = Omit<ITr, 'tdList'> & { tdList: CloneTd[] }
                let lastColspan = 0
                const cloneTr: CloneTr = {
                  ...deepClone(originTr),
                  id: getUUID(),
                  originalId: originTr.originalId ?? originTr.id,
                  minHeight: undefined,
                  tdList: element
                    .colgroup!.map((_col, cIdx): CloneTd | undefined => {
                      lastColspan--
                      if (lastColspan > 0) {
                        return
                      }
                      const findTd = originTr.tdList.find(
                        td => td.colIndex === cIdx
                      )
                      // 原始td 跨行单元格向上查找
                      const originTd =
                        findTd ??
                        this.tableParticle.findPreRowSpanTd(trList, r, cIdx)

                      if (!originTd) {
                        console.error(`[创建 cloneTr] 错误：列 ${cIdx} 没有找到对应的单元格！`)
                        return undefined
                      }

                      // 设置lastColspan以跳过跨列的后续列
                      if (findTd) {
                        lastColspan = findTd.colspan
                      } else if (originTd) {
                        lastColspan = originTd.colspan
                      }
                      const tdId = getUUID()
                      if (originTd.originalRowspan === undefined) {
                        originTd.originalRowspan = originTd.rowspan
                      }
                      return findTd
                        ? {
                            ...findTd,
                            id: tdId,
                            originalId: findTd.id,
                            linkTdPrevId: findTd.id,
                            colIndex: cIdx,
                            tdIndex: cIdx,
                            original: originTd,
                            originalRowspan: originTd.originalRowspan  // 继承原始的跨行数
                          }
                        : {
                            id: tdId,
                            originalId: originTd.id,
                            linkTdPrevId: originTd.id,
                            colIndex: cIdx,
                            tdIndex: cIdx,
                            colspan: originTd.colspan,
                            rowspan: 1,
                            value: [],
                            rowList: [],
                            original: originTd,
                            originalRowspan: originTd.originalRowspan  // 继承原始的跨行数
                          }
                    })
                    // 过滤跨列单元格 确保colspan都是>0
                    .filter((td): td is CloneTd => !!td)
                }

                // 创建拆分出来的单元格集合
                const cloneTdList = cloneTr.tdList

                const originTdList = cloneTdList.map(
                  cloneTd => cloneTd.original
                )

                // 循环拆分td项
                originTdList.forEach((originTd, index) => {
                  const rowList: IRow[] = []
                  // td 高度大于可用高度时 需要拆分
                  let maxHeight = usableHeight
                  if (originTd.rowspan > 1) {
                    // 跨行单元格，最大高度需要加上已经跨过的所有tr高度之和
                    const rowSpanTrList = trList.slice(
                      originTd.trIndex,
                      originTd.trIndex! + r - originTd.trIndex!
                    )
                    maxHeight += rowSpanTrList.reduce(
                      (pre, cur) => cur.height * scale + pre,
                      0
                    )
                  }
                  while (
                    originTd.mainHeight! * scale > maxHeight &&
                    originTd.rowList?.length
                  ) {
                    const deleteTdRow = originTd.rowList.pop()!
                    originTd.value.splice(
                      originTd.value.length - deleteTdRow.elementList.length
                    )
                    rowList.unshift(deleteTdRow)
                    originTd.mainHeight! -= deleteTdRow.height / scale
                  }
                  // Clear stale positionList when value changes
                  originTd.positionList = []
                  const cloneTd = cloneTdList[index]
                  cloneTd.rowList = rowList
                  cloneTd.value = rowList.map(row => row.elementList).flat()
                  cloneTd.positionList = []
                })

                // 还原数据
                let restoreValue = true
                // 判断当前行是否有内容
                // 只检查 rowList 是否有内容，不考虑 rowspan
                // 因为跨行单元格的内容在起始行，后续被跨越的行不应该被判断为"有内容"
                const originTrHasContent = originTr.tdList.some(
                  td => td.rowList && td.rowList.length > 0
                )
                // 判断拆分行是否有内容
                // 同样只检查 rowList，不考虑 rowspan（拆分行的 rowspan 总是 1）
                const cloneTrHasContent = cloneTr.tdList.some(
                  td => td.rowList && td.rowList.length > 0
                )

                // 本页剩余空间是否容不下该行的最小高度（驱动 minHeight 按比例拆分到两页）
                const minHeightOverflow = originTr.minHeight! > usableHeight
                // 行自身最小高度是否连一个全新页面都容不下：
                // 只有这种"巨型空行"才需要在完全没有内容的情况下被强制按高度拆分，
                // 否则一个短内容、大空白的行应整行移动到下一页，避免产生空占位行
                const giantRowOverflow = originTr.minHeight! > fullPageHeight

                // 被拆分行的上半部分是否保留在第一页：
                // 原行本身有内容 -> 保留在第一页，按 minHeight 将剩余空白拆分到下一页
                // （即使拆分行没有内容，也要把用不完的空白高度带过去）；
                // 原行无内容且拆分行也无内容时，只有"巨型空行"才强制拆分，否则整行下移
                const splitRowKeptOnPage1 =
                  originTrHasContent ||
                  (!cloneTrHasContent && giantRowOverflow)

                if (cloneTrHasContent || minHeightOverflow) {
                  if (splitRowKeptOnPage1) {
                    // 情况1：原始行有内容，需要保留在第一页
                    // 插入 cloneTr 到第一页，作为拆分点所在的行
                    if (minHeightOverflow) {
                      // 本页剩余空间放不下该行最小高度，将空白部分按比例
                      // 拆到下一页：第一页用满剩余空间，下一页承接剩余高度
                      originTr.originalMinHeight = originTr.minHeight!
                      originTr.minHeight = usableHeight
                      cloneTr.minHeight = Math.max(
                        originTr.originalMinHeight - usableHeight,
                        defaultTrMinHeight
                      )
                    }

                    cloneTr.tdList.forEach(td => {
                      td.original.linkTdNextId = td.id
                      if (td.value.length) {
                        if (td.value[0].value !== ZERO) {
                          // 如果没有占位符,插入占位符
                          td.value.unshift({
                            ...td.original.value.slice(-1).pop(),
                            value: ZERO,
                            type: ElementType.SPLIT_TAG
                          })
                        }
                      }
                    })
                    // 新的表格行插入到指定位置
                    trList.splice(deleteStart + 1, 0, cloneTr)
                    deleteStart += 1
                    deleteCount = trList.length - deleteStart
                    restoreValue = false
                  } else {
                    // 原始行无内容（内容全部下移），deleteStart 仍为 r，
                    // 整行连同后续行移动到下一页
                    deleteCount = trList.length - deleteStart
                  }

                  // 处理跨行单元格
                  originTdList.forEach((td) => {
                    if (td.rowspan > 1) {
                      // 检查是否真的覆盖当前行
                      if (td.trIndex! + td.rowspan <= r) {
                        // 跳过这个单元格
                        return
                      }

                      // 保存原始的 rowspan（如果还没有保存）
                      if (td.originalRowspan === undefined) {
                        td.originalRowspan = td.rowspan
                      }

                      // 计算当前页和下一页的 rowspan
                      // 跨行单元格从 td.trIndex 开始，跨越 td.originalRowspan 行
                      // 拆分点在 r，需要计算：
                      // 1. 当前页应该跨越多少行（td.rowspan）
                      // 2. 下一页应该跨越多少行（cloneTd.rowspan）

                      let rowsInCurrentPage: number
                      let rowsInNextPage: number

                      if (td.trIndex === r) {
                        // 拆分点在起始行
                        // 当 originTrHasContent = false 时，原始行会被移到下一页
                        // 跨行单元格应该完整地在第二页
                        if (splitRowKeptOnPage1) {
                          // 原始行有内容并保留在当前页
                          // 跨行单元格至少占用起始行，所以 rowsInCurrentPage 至少为 1
                          rowsInCurrentPage = 1
                          // 下一页只包含剩余的 originalRowspan - 1 行
                          rowsInNextPage = td.originalRowspan - 1
                        } else {
                          // 原始行没有内容会被移到下一页
                          // 跨行单元格完整地在第二页，第一页不显示
                          rowsInCurrentPage = 0
                          rowsInNextPage = td.originalRowspan
                        }
                      } else {
                        // 拆分点不在起始行
                        // 当前页跨越 r - td.trIndex 行
                        // 如果 originTrHasContent = true，再加 1 行（包含当前行）
                        // 如果 originTrHasContent = false，不加（不包含当前行，当前行会被移到下一页）
                        rowsInCurrentPage =
                          r - td.trIndex! + (splitRowKeptOnPage1 ? 1 : 0)
                        // 下一页的行数 = 原始行数 - 当前页占用的行数
                        rowsInNextPage = td.originalRowspan - rowsInCurrentPage
                      }

                      // 上半部分保留在第一页时，cloneTr 会作为额外一行进入下一页
                      if (splitRowKeptOnPage1 && rowsInNextPage > 0) {
                        rowsInNextPage += 1
                      }

                      // 只有当 rowsInCurrentPage > 0 时才设置当前页的 rowspan
                      if (rowsInCurrentPage > 0) {
                        td.rowspan = rowsInCurrentPage
                      }

                      // 如果 rowsInNextPage <= 0，说明跨行单元格不需要拆分，跳过后续处理
                      if (rowsInNextPage <= 0) {
                        return
                      }

                      const cloneTd = cloneTr.tdList.find(
                        cloneTd => cloneTd.colIndex === td.colIndex
                      )!

                      if (splitRowKeptOnPage1) {
                        // 上半部分保留在第一页，cloneTr 已插入，cloneTd 承载下一页剩余行
                        // 设置 cloneTd.rowspan 为剩余行数
                        cloneTd.rowspan = rowsInNextPage
                      } else {
                        // 原始行没有内容，cloneTr 会被移到下一页
                        // 检查是否在跨行单元格的起始行拆分
                        if (td.trIndex === r) {
                          // 拆分点在跨行单元格的起始行
                          // 在这种情况下，不应该将跨行单元格添加到第一页
                          // 应该让整个跨行单元格保持在第二页
                          // 设置 cloneTd 为完整的跨行单元格
                          cloneTd.rowspan = rowsInNextPage
                          cloneTd.originalRowspan = td.originalRowspan
                          // 不需要设置 linkTdPrevId，因为这个单元格完整地在第二页
                        } else {
                          // 拆分点不在起始行，需要在第一页显示跨行单元格的剩余部分
                          // 先保存 cloneTd 的内容
                          const savedValue = [...cloneTd.value]
                          const savedRowList = [...(cloneTd.rowList || [])]

                          // 立即清空 cloneTd，防止被复制到 newTd
                          cloneTd.value = []
                          cloneTd.rowList = []
                          cloneTd.rowspan = 1

                          // 设置 linkTdNextId，建立与下一页单元格的关联
                          cloneTd.original.linkTdNextId = cloneTd.id

                          // 查找 originTr 中是否已有相同 colIndex 的单元格
                          const existingTdIndex = originTr.tdList.findIndex(
                            td => td.colIndex === cloneTd.colIndex
                          )

                          if (existingTdIndex !== -1) {
                            // 替换现有的空单元格
                            originTr.tdList[existingTdIndex] = {
                              ...originTr.tdList[existingTdIndex],
                              rowspan: rowsInNextPage,
                              value: savedValue,
                              rowList: savedRowList,
                              // @ts-ignore
                              original: cloneTd.original,
                              originalRowspan: cloneTd.originalRowspan
                            }
                          } else {
                            // 没有，添加新的单元格
                            const newTd = {
                              id: cloneTd.id,
                              originalId: cloneTd.originalId,
                              linkTdPrevId: cloneTd.linkTdPrevId,
                              colIndex: cloneTd.colIndex,
                              tdIndex: cloneTd.tdIndex,
                              colspan: td.colspan,
                              rowspan: rowsInNextPage,
                              value: savedValue,
                              rowList: savedRowList,
                              original: cloneTd.original,
                              originalRowspan: cloneTd.originalRowspan,
                              // 不复制 td 的 trIndex 等位置信息，因为这些属于原始单元格
                              // 新单元格的位置信息会在后续 initTableElementIndex 中重新计算
                            }
                            originTr.tdList.push(newTd)

                            // 按 colIndex 排序，确保单元格顺序正确
                            originTr.tdList.sort(
                              (a, b) => a.colIndex! - b.colIndex!
                            )
                          }
                        }
                      }
                    }
                  })
                  if (restoreValue) {
                    // 未保留在第一页 立即还原被弹出的内容
                    originTdList.forEach((td, index) => {
                      td.value.push(...cloneTdList[index].value)
                    })
                  }
                  break
                }
              }
              deleteStart = r + 1
              deleteCount = trList.length - deleteStart
              preTrHeight += trHeight
              usableHeight -= trHeight
            }

            if (deleteCount) {
              // 继续对单元格进行拆分
              const cloneTrList = trList.splice(deleteStart, deleteCount)
              const pagingId = element.pagingId || getUUID()
              element.pagingId = pagingId

              // 追加拆分表格（不使用 deepClone，手动创建新对象，避免丢失 originalRowspan）
              const cloneElement: IElement = {
                ...element,
                id: getUUID(),
                originalId: element.originalId ?? element.id,
                pagingId: pagingId,
                pagingIndex: element.pagingIndex! + 1,
                trList: []  // 临时设置为空，后面会赋值
              }

              // 处理分页重复表头
              const repeatTrList = trList.filter(tr => tr.pagingRepeat)
              if (repeatTrList.length) {
                const cloneRepeatTrList = deepClone(repeatTrList)
                cloneRepeatTrList.forEach(tr => (tr.id = getUUID()))
                cloneTrList.unshift(...cloneRepeatTrList)
              }
              cloneElement.trList = cloneTrList

              // 刷新 cloneElement 中所有 td 的 trIndex/rowIndex 等位置字段，
              // 使后续跨行单元格的 rowspan 计算基于新表格的行序号，而非原始表格的行序号
              this.tableParticle.computeTrHeight(cloneElement)

              // 修复跨行单元格的 rowspan：确保拆分后的跨行单元格正确显示
              // 遍历拆分出的表格，检查每个跨行单元格
              cloneElement.trList?.forEach((tr, trIndex) => {
                tr.tdList.forEach(td => {
                  // 如果单元格有 linkTdPrevId，说明它是从前面页拆分过来的跨行单元格
                  if (td.linkTdPrevId && td.originalRowspan !== undefined && td.originalRowspan > 1) {
                    // 确保 rowspan 不超过当前拆分表格的剩余行数
                    const maxRowspan = cloneElement.trList!.length - trIndex
                    if (td.rowspan > maxRowspan) {
                      td.rowspan = maxRowspan
                    }
                  } else if (td.rowspan > 1) {
                    // 没有拆分信息的跨行单元格，确保 rowspan 不超过表格剩余行数
                    const maxRowspan = cloneElement.trList!.length - trIndex
                    if (td.rowspan > maxRowspan) {
                      td.rowspan = maxRowspan
                    }
                  }
                })
              })

              // 更新表格内部元素的所属信息
              cloneElement.trList?.forEach(tr => {
                tr.tdList.forEach(td => {
                  delete td.valueStartIndex
                  if (td.linkTdPrevId) {
                    const prevTd = this.getTdById(td.linkTdPrevId!)
                    td.valueStartIndex = prevTd
                      ? (prevTd.valueStartIndex ?? 0) + prevTd.value.length
                      : 0
                    if (this.splitTdValueMap.has(td.originalId!)) {
                      this.splitTdValueMap
                        .get(td.originalId!)!
                        .push(...td.value)
                    } else if (prevTd) {
                      this.splitTdValueMap.set(td.originalId!, [
                        ...prevTd.value,
                        ...td.value
                      ])
                    }
                  }
                  td.value.forEach(element =>
                    this.updateElementTableInfo(element, cloneElement, tr, td)
                  )
                })
              })
              this.spliceElementList(elementList, i + 1, 0, [cloneElement])

              // 计算出表格高度
              this.tableParticle.computeTrHeight(element)
              const tableHeight = this.tableParticle.getTableHeight(element)
              const elementHeight = tableHeight * scale
              element.height = tableHeight
              metrics.height = elementHeight
              metrics.boundingBoxDescent = elementHeight
            }
          }

          // 表格经过分页处理-需要处理上下文
          if (element.pagingId) {
            const positionContext = this.position.getPositionContext()
            if (positionContext.isTable) {
              // 查找光标所在表格索引（根据trId、tdId或linkTdPrevId搜索）
              let newPositionContextIndex = -1
              let newPositionContextTrIndex = -1
              let newPositionContextTdIndex = -1
              let foundTd: ITd | null = null
              let tableIndex = i

              while (tableIndex < elementList.length) {
                const curElement = elementList[tableIndex]
                if (curElement.pagingId !== element.pagingId) break

                // 首先尝试通过原始 trId 查找
                let trIndex = curElement.trList!.findIndex(
                  r => r.id === positionContext.trId
                )

                // 如果找不到，尝试通过 originalId 查找（行拆分后会有新的 id，但保留 originalId）
                if (!~trIndex) {
                  trIndex = curElement.trList!.findIndex(
                    r => r.originalId === positionContext.trId
                  )
                }

                if (~trIndex) {
                  const tr = curElement.trList![trIndex]
                  // 首先尝试通过原始 tdId 查找
                  let tdIndex = tr.tdList.findIndex(
                    td => td.id === positionContext.tdId
                  )

                  // 如果找不到，尝试通过 linkTdPrevId 查找（单元格拆分后会有新的 id，linkTdPrevId 指向原单元格）
                  if (!~tdIndex) {
                    tdIndex = tr.tdList.findIndex(
                      td => td.linkTdPrevId === positionContext.tdId
                    )
                  }

                  // 如果还是找不到，尝试通过 originalId 查找
                  if (!~tdIndex) {
                    tdIndex = tr.tdList.findIndex(
                      td => td.originalId === positionContext.tdId
                    )
                  }

                  if (~tdIndex) {
                    const matchedTd = tr.tdList[tdIndex]
                    // tdId 直接匹配：合并后 positionContext.tdId 可能被覆盖为首页单元格 ID
                    // 当 range 超出该 td 的 positionList 长度时，说明光标实际内容在后续拆分页中
                    // 此时应跳过该"陈旧"匹配，继续搜索后续拆分表格
                    // linkTdPrevId/originalId 匹配：通过拆分链找到的单元格，直接接受
                    const rangeStartIndex = this.range.getRange().startIndex
                    if (
                      matchedTd.id === positionContext.tdId &&
                      matchedTd.positionList &&
                      rangeStartIndex >= matchedTd.positionList.length
                    ) {
                      // 陈旧匹配，跳过继续搜索
                    } else {
                      newPositionContextIndex = tableIndex
                      newPositionContextTrIndex = trIndex
                      newPositionContextTdIndex = tdIndex
                      foundTd = matchedTd
                      break
                    }
                  }
                }
                tableIndex++
              }

              if (~newPositionContextIndex && foundTd) {
                const newTable = elementList[newPositionContextIndex]
                const newTr = newTable.trList![newPositionContextTrIndex]
                const newTd = foundTd

                // 检查是否需要调整 range 索引
                // 如果找到了拆分后的单元格（通过 linkTdPrevId 或 originalId），需要计算正确的索引
                let newStartIndex = this.range.getRange().startIndex

                // 如果新单元格有 valueStartIndex，说明它是拆分后的单元格
                // 需要根据 valueStartIndex 调整光标位置
                if (newTd.valueStartIndex !== undefined && newTd.linkTdPrevId) {
                  // 当前光标位置减去拆分点，得到拆分后单元格中的相对位置
                  // 但是需要确保结果在有效范围内
                  const relativeIndex = newStartIndex - newTd.valueStartIndex

                  if (relativeIndex >= 0 && relativeIndex < newTd.value.length) {
                    newStartIndex = relativeIndex
                  } else if (newTd.value.length > 0) {
                    // 如果相对位置无效，使用最后一个有效位置
                    newStartIndex = newTd.value.length - 1
                  } else {
                    newStartIndex = 0
                  }
                } else {
                  // 不是拆分后的单元格，检查索引是否在有效范围内
                  if (newTd.positionList) {
                    const maxIndex = newTd.positionList.length - 1
                    if (maxIndex >= 0 && newStartIndex > maxIndex) {
                      newStartIndex = maxIndex
                    }
                  }
                }

                positionContext.index = newPositionContextIndex
                positionContext.trIndex = newPositionContextTrIndex
                positionContext.tdIndex = newPositionContextTdIndex
                positionContext.trId = newTr.id
                positionContext.tdId = newTd.id
                positionContext.tableId = newTable.id
                this.position.setPositionContext(positionContext)
                this.range.setRange(newStartIndex, newStartIndex)
              } else {
                // 如果找不到单元格，可能是表格重新分页后，光标所在的行被移动到了拆分后的表格中
                // 使用 fixPosition 来修复光标位置
                this.fixPosition()
              }
            }
          }
        }
        this.initTableElementIndex(element, i)
      } else if (element.type === ElementType.SEPARATOR) {
        const {
          separator: { lineWidth: defaultLineWidth }
        } = this.options
        const lineWidth = element.lineWidth || defaultLineWidth
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = lineWidth * scale
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin + metrics.height
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = defaultSize
      } else if (
        element.type === ElementType.RADIO ||
        element.controlComponent === ControlComponent.RADIO
      ) {
        const { width, height, gap } = this.options.radio
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = this.options.checkbox
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (element.type === ElementType.TAB) {
        metrics.width = defaultTabWidth * scale
        metrics.height = defaultSize * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent =
          this.textParticle.getBasisWordBoundingBoxAscent(ctx, ctx.font)
      } else if (element.isControlMinWidthPlaceholder) {
        metrics.width = (element.width || 0) * scale
        metrics.height = defaultSize * scale
        ctx.font = this.getElementFont(element)
        const basisMetrics = this.textParticle.measureBasisWord(
          ctx,
          element.font!
        )
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
      } else if (element.type === ElementType.BLOCK) {
        if (!element.width) {
          metrics.width = availableWidth
        } else {
          const elementWidth = element.width * scale
          metrics.width = Math.min(elementWidth, availableWidth)
        }
        metrics.height = element.height! * scale
        metrics.boundingBoxDescent = metrics.height
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.LABEL) {
        const {
          defaultSize,
          label: { defaultPadding }
        } = this.options
        ctx.font = this.getElementFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width =
          (fontMetrics.width + defaultPadding[1] + defaultPadding[3]) * scale
        metrics.height = (element.size || defaultSize) * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent =
          (defaultPadding[0] + fontMetrics.actualBoundingBoxAscent) * scale
      } else {
        // 设置上下标真实字体尺寸
        const size = element.size || defaultSize
        if (
          element.type === ElementType.SUPERSCRIPT ||
          element.type === ElementType.SUBSCRIPT
        ) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = (element.actualSize || size) * scale
        ctx.font = this.getElementFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing * scale
        }
        // 使用基于字体的基准度量以确保一致的行高，避免字符特定度量导致的布局跳动
        const basisMetrics = this.textParticle.measureBasisWord(
          ctx,
          element.font!
        )
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent =
        !element.hide &&
        ((element.imgDisplay !== ImageDisplay.INLINE &&
          element.type === ElementType.IMAGE) ||
          element.type === ElementType.LATEX)
          ? metrics.height + rowMargin
          : metrics.boundingBoxAscent + rowMargin
      const height =
        rowMargin +
        metrics.boundingBoxAscent +
        metrics.boundingBoxDescent +
        rowMargin
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        left: 0,
        style: this.getElementFont(element, scale)
      })
      // 控件开始时统计宽度，结束时消费最小宽度并补充跨行占位
      if (
        rowElement.control?.minWidth &&
        !rowElement.isControlMinWidthPlaceholder
      ) {
        if (rowElement.controlComponent) {
          controlRealWidth += metrics.width
        }
        if (rowElement.controlComponent === ControlComponent.POSTFIX) {
          const controlMinWidth = rowElement.control.minWidth * scale
          const extraWidth = controlMinWidth - controlRealWidth
          const rowRemainingWidth = Math.max(
            availableWidth - curRow.width - rowElement.metrics.width,
            0
          )
          // 设置最小宽度控件属性（字符偏移量）
          this.control.setMinWidthControlInfo({
            row: curRow,
            rowElement,
            availableWidth,
            controlRealWidth
          })
          let placeholderWidth = extraWidth - rowRemainingWidth
          const placeholderList: IElement[] = []
          while (placeholderWidth > 0) {
            const width = Math.min(placeholderWidth, availableWidth)
            placeholderList.push({
              ...rowElement,
              value: '',
              width: width / scale,
              left: 0,
              isControlMinWidthPlaceholder: true
            } as IElement)
            placeholderWidth -= width
          }
          if (placeholderList.length) {
            elementList.splice(i + 1, 0, ...placeholderList)
            this.controlMinWidthPlaceholderElementListSet.add(elementList)
          }
          controlRealWidth = 0
        }
      }
      // 超过限定宽度
      const preElement = elementList[i - 1]
      let nextElement = elementList[i + 1]
      // 累计行宽 + 当前元素宽度 + 排版宽度(英文单词整体宽度 + 后面标点符号宽度)
      let curRowWidth = curRow.width + metrics.width
      if (this.options.wordBreak === WordBreak.BREAK_WORD) {
        if (
          (!preElement?.type || preElement?.type === ElementType.TEXT) &&
          (!element.type || element.type === ElementType.TEXT)
        ) {
          // 英文单词
          const word = `${preElement?.value || ''}${element.value}`
          if (this.WORD_LIKE_REG.test(word)) {
            const { width, endElement } = this.textParticle.measureWord(
              ctx,
              elementList,
              i
            )
            // 后面存在元素 && 单词宽度大于行可用宽度，无需折行
            const wordWidth = width * scale
            if (endElement && wordWidth <= availableWidth) {
              curRowWidth += wordWidth
              nextElement = endElement
            }
          }
          // 标点符号
          const punctuationWidth = this.textParticle.measurePunctuationWidth(
            ctx,
            nextElement
          )
          curRowWidth += punctuationWidth * scale
        }
      }
      // 列表信息
      if (element.listId) {
        if (element.listId !== listId) {
          listIndex = 0
        } else if (element.value === ZERO && !element.listWrap) {
          listIndex++
        }
      }
      listId = element.listId
      // 计算四周环绕导致的元素偏移量
      const surroundPosition = this.position.setSurroundPosition({
        pageNo,
        rowElement,
        row: curRow,
        rowElementRect: {
          x,
          y,
          height,
          width: metrics.width
        },
        availableWidth,
        surroundElementList
      })
      x = surroundPosition.x
      curRowWidth += surroundPosition.rowIncreaseWidth
      x += metrics.width
      // 是否强制换行
      const isForceBreak =
        element.type === ElementType.SEPARATOR ||
        element.type === ElementType.TABLE ||
        preElement?.type === ElementType.TABLE ||
        preElement?.type === ElementType.BLOCK ||
        element.type === ElementType.BLOCK ||
        preElement?.imgDisplay === ImageDisplay.INLINE ||
        element.imgDisplay === ImageDisplay.INLINE ||
        preElement?.listId !== element.listId ||
        (preElement?.areaId !== element.areaId &&
          !(element.area?.hide && !this.isAreaHideDisabled())) ||
        (element.control?.flexDirection === FlexDirection.COLUMN &&
          (element.controlComponent === ControlComponent.CHECKBOX ||
            element.controlComponent === ControlComponent.RADIO) &&
          preElement?.controlComponent === ControlComponent.VALUE) ||
        (i !== 0 &&
          element.value === ZERO &&
          !(element.area?.hide && !this.isAreaHideDisabled()))
      // 是否宽度不足导致换行
      const isWidthNotEnough = curRowWidth > availableWidth
      const isWrap = isForceBreak || isWidthNotEnough
      // 新行数据处理
      if (isWrap) {
        const row: IRow = {
          width: metrics.width,
          height,
          startIndex: i,
          elementList: [rowElement],
          ascent,
          rowIndex: curRow.rowIndex + 1,
          rowFlex: elementList[i]?.rowFlex || elementList[i + 1]?.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK
        }
        // 控件缩进
        if (
          rowElement.controlComponent !== ControlComponent.PREFIX &&
          rowElement.control?.indentation === ControlIndentation.VALUE_START
        ) {
          // 查找到非前缀的第一个元素位置
          const preStartIndex = curRow.elementList.findIndex(
            el =>
              el.controlId === rowElement.controlId &&
              el.controlComponent !== ControlComponent.PREFIX
          )
          if (~preStartIndex) {
            const preRowPositionList = this.position.computeRowPosition({
              row: curRow,
              innerWidth: this.getInnerWidth()
            })
            const valueStartPosition = preRowPositionList[preStartIndex]
            if (valueStartPosition) {
              row.offsetX = valueStartPosition.coordinate.leftTop[0]
            }
          }
        }
        // 列表缩进
        if (element.listId) {
          row.isList = true
          row.offsetX = listStyleMap.get(element.listId!)
          row.listIndex = listIndex
        }
        // Y轴偏移量
        row.offsetY =
          !isFromTable &&
          element.area?.top &&
          element.areaId !== elementList[i - 1]?.areaId
            ? element.area.top * scale
            : 0
        rowList.push(row)
      } else {
        curRow.width += metrics.width
        // 减小块元素前第一行空行行高
        if (
          i === 0 &&
          (getIsBlockElement(elementList[1]) || !!elementList[1]?.areaId)
        ) {
          curRow.height = defaultBasicRowMarginHeight
          curRow.ascent = defaultBasicRowMarginHeight
        } else if (curRow.height < height) {
          curRow.height = height
          curRow.ascent = ascent
        }
        curRow.elementList.push(rowElement)
      }
      // 行结束时逻辑
      if (isWrap || i === elementList.length - 1) {
        // 换行原因：宽度不足
        curRow.isWidthNotEnough = isWidthNotEnough && !isForceBreak
        // 两端对齐、分散对齐
        if (
          !curRow.isSurround &&
          (preElement?.rowFlex === RowFlex.JUSTIFY ||
            (preElement?.rowFlex === RowFlex.ALIGNMENT &&
              curRow.isWidthNotEnough))
        ) {
          // 忽略换行符及尾部元素间隔设置
          const rowElementList =
            curRow.elementList[0]?.value === ZERO
              ? curRow.elementList.slice(1)
              : curRow.elementList
          const gap =
            (availableWidth - curRow.width) / (rowElementList.length - 1)
          for (let e = 0; e < rowElementList.length - 1; e++) {
            const el = rowElementList[e]
            el.metrics.width += gap
          }
          curRow.width = availableWidth
        }
      }
      // 重新计算坐标、页码、下一行首行元素环绕交叉
      if (isWrap) {
        x = startX
        y += curRow.height
        if (
          isPagingMode &&
          !isFromTable &&
          pageHeight &&
          (y - startY + mainOuterHeight + height > pageHeight ||
            element.type === ElementType.PAGE_BREAK)
        ) {
          y = startY
          // 删除多余四周环绕型元素
          deleteSurroundElementList(surroundElementList, pageNo)
          pageNo += 1
        }
        // 计算下一行第一个元素是否存在环绕交叉
        rowElement.left = 0
        const nextRow = rowList[rowList.length - 1]
        const surroundPosition = this.position.setSurroundPosition({
          pageNo,
          rowElement,
          row: nextRow,
          rowElementRect: {
            x,
            y,
            height,
            width: metrics.width
          },
          availableWidth,
          surroundElementList
        })
        x = surroundPosition.x
        x += metrics.width
      }
    }
    return rowList
  }

  private _computePageList(): IRow[][] {
    const pageRowList: IRow[][] = [[]]
    const {
      pageMode,
      pageNumber: { maxPageNo }
    } = this.options
    const height = this.getHeight()
    const marginHeight = this.getMainOuterHeight()
    let pageHeight = marginHeight
    let pageNo = 0
    if (pageMode === PageMode.CONTINUITY) {
      pageRowList[0] = this.rowList
      // 重置高度
      pageHeight += this.rowList.reduce(
        (pre, cur) => pre + cur.height + (cur.offsetY || 0),
        0
      )
      const dpr = this.getPagePixelRatio()
      const pageDom = this.pageList[0]
      const pageDomHeight = Number(pageDom.style.height.replace('px', ''))
      if (pageHeight > pageDomHeight) {
        pageDom.style.height = `${pageHeight}px`
        pageDom.height = pageHeight * dpr
      } else {
        const reduceHeight = pageHeight < height ? height : pageHeight
        pageDom.style.height = `${reduceHeight}px`
        pageDom.height = reduceHeight * dpr
      }
      this._initPageContext(this.ctxList[0])
    } else {
      for (let i = 0; i < this.rowList.length; i++) {
        const row = this.rowList[i]
        const rowOffsetY = row.offsetY || 0

        // 检查是否包含分页表格（pagingIndex > 0）
        const tableElement = row.elementList.find(e => e.type === ElementType.TABLE)
        const isPagedTable = tableElement && tableElement.pagingId && tableElement.pagingIndex && tableElement.pagingIndex > 0

        // 对于分页表格，强制从新页面开始
        const needNewPage = isPagedTable ||
          row.height + rowOffsetY + pageHeight > height ||
          this.rowList[i - 1]?.isPageBreak

        if (needNewPage) {
          if (Number.isInteger(maxPageNo) && pageNo >= maxPageNo!) {
            this.elementList = this.elementList.slice(0, row.startIndex)
            break
          }

          pageHeight = marginHeight + row.height + rowOffsetY
          pageRowList.push([row])
          pageNo++
        } else {
          pageHeight += row.height + rowOffsetY
          pageRowList[pageNo].push(row)
        }
      }
    }
    return pageRowList
  }

  private _drawHighlight(
    ctx: CanvasRenderingContext2D,
    payload: IDrawRowPayload
  ) {
    const { rowList, positionList, elementList } = payload
    const marginHeight = this.getDefaultBasicRowMarginHeight()
    const highlightMarginHeight = this.getHighlightMarginHeight()
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const preElement = curRow.elementList[j - 1]
        // 高亮配置：元素 > 控件配置
        const highlight =
          element.highlight ||
          this.control.getControlHighlight(elementList, curRow.startIndex + j)
        if (highlight) {
          // 高亮元素相连需立即绘制，并记录下一元素坐标
          if (
            preElement &&
            preElement.highlight &&
            preElement.highlight !== element.highlight
          ) {
            this.highlight.render(ctx)
          }
          // 当前元素位置信息记录
          const positionItem = positionList[curRow.startIndex + j]
          if (!positionItem) {
            continue
          }
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = positionItem
          // 元素向左偏移量
          const offsetX = element.left || 0
          this.highlight.recordFillInfo(
            ctx,
            x - offsetX,
            y + marginHeight - highlightMarginHeight, // 先减去行margin，再加上高亮margin
            element.metrics.width + offsetX,
            curRow.height - 2 * marginHeight + 2 * highlightMarginHeight,
            highlight
          )
        } else if (preElement?.highlight) {
          // 之前是高亮元素，当前不是需立即绘制
          this.highlight.render(ctx)
        }
      }
      this.highlight.render(ctx)
    }
  }

  public drawRow(ctx: CanvasRenderingContext2D, payload: IDrawRowPayload) {
    // 优先绘制高亮元素
    this._drawHighlight(ctx, payload)
    // 绘制元素、下划线、删除线、选区
    const {
      scale,
      table: { tdPadding },
      group,
      lineBreak,
      whiteSpace
    } = this.options
    const {
      rowList,
      pageNo,
      elementList,
      positionList,
      startIndex,
      zone,
      td,
      isDrawLineBreak = !lineBreak.disabled,
      isDrawWhiteSpace = !whiteSpace.disabled
    } = payload
    const isPrintMode = this.isPrintMode()
    const isGraffitiMode = this.isGraffitiMode()
    const { isCrossRowCol, tableId } = this.range.getRange()
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 选区绘制记录
      const rangeRecord: IElementFillRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
      let tableRangeElement: IElement | null = null
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        // 当前元素位置信息
        const positionItem = positionList[curRow.startIndex + j]
        if (!positionItem) {
          // positionList可能未同步，跳过绘制
          index++
          continue
        }
        const {
          ascent: offsetY,
          coordinate: {
            leftTop: [x, y]
          }
        } = positionItem
        const preElement = curRow.elementList[j - 1]
        // 元素绘制
        if (
          (element.hide ||
            element.control?.hide ||
            (element.area?.hide && !this.isAreaHideDisabled())) &&
          !this.isDesignMode()
        ) {
          // 控件隐藏时不绘制
          this.textParticle.complete()
        } else if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          // 浮动图片单独绘制
          if (
            element.imgDisplay !== ImageDisplay.SURROUND &&
            element.imgDisplay !== ImageDisplay.FLOAT_TOP &&
            element.imgDisplay !== ImageDisplay.FLOAT_BOTTOM
          ) {
            this.imageParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.LATEX) {
          this.textParticle.complete()
          this.laTexParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          if (isCrossRowCol) {
            rangeRecord.x = x
            rangeRecord.y = y
            tableRangeElement = element
          }
          this.tableParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.HYPERLINK) {
          this.textParticle.complete()
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.LABEL) {
          this.textParticle.complete()
          this.labelParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.DATE) {
          const nextElement = curRow.elementList[j + 1]
          // 释放之前的
          if (!preElement || preElement.dateId !== element.dateId) {
            this.textParticle.complete()
          }
          this.textParticle.record(ctx, element, x, y + offsetY)
          if (!nextElement || nextElement.dateId !== element.dateId) {
            // 手动触发渲染
            this.textParticle.complete()
          }
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.underline.render(ctx)
          this.textParticle.complete()
          this.subscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SEPARATOR) {
          this.separatorParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.PAGE_BREAK) {
          if (this.mode !== EditorMode.CLEAN && !isPrintMode) {
            this.pageBreakParticle.render(ctx, element, x, y)
          }
        } else if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          this.textParticle.complete()
          this.checkboxParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          this.textParticle.complete()
          this.radioParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (element.type === ElementType.TAB) {
          this.textParticle.complete()
        } else if (
          element.rowFlex === RowFlex.ALIGNMENT ||
          element.rowFlex === RowFlex.JUSTIFY
        ) {
          // 如果是两端对齐，因canvas目前不支持letterSpacing需单独绘制文本
          this.textParticle.record(ctx, element, x, y + offsetY)
          this.textParticle.complete()
        } else if (element.type === ElementType.BLOCK) {
          this.textParticle.complete()
          this.blockParticle.render(ctx, pageNo, element, x, y + offsetY)
        } else {
          // 如果当前元素设置左偏移，则上一元素立即绘制
          if (element.left) {
            this.textParticle.complete()
          }
          this.textParticle.record(ctx, element, x, y + offsetY)
          // 如果设置字宽、字间距、标点符号（避免浏览器排版缩小间距）需单独绘制
          if (
            element.width ||
            element.letterSpacing ||
            PUNCTUATION_REG.test(element.value)
          ) {
            this.textParticle.complete()
          }
        }
        // 换行符绘制
        if (
          isDrawLineBreak &&
          !isPrintMode &&
          this.mode !== EditorMode.CLEAN &&
          !curRow.isWidthNotEnough &&
          j === curRow.elementList.length - 1
        ) {
          this.lineBreakParticle.render(ctx, element, x, y + curRow.height / 2)
        }
        // 空白符绘制
        if (isDrawWhiteSpace && WHITE_SPACE_REG.test(element.value)) {
          this.whiteSpaceParticle.render(ctx, element, x, y + curRow.height / 2)
        }
        // 边框绘制（目前仅支持控件）
        if (element.control?.border) {
          // 不同控件边框立刻绘制
          if (
            preElement?.control?.border &&
            preElement.controlId !== element.controlId
          ) {
            this.control.drawBorder(ctx)
          }
          // 当前元素位置信息记录
          const rowMargin = this.getElementRowMargin(element)
          this.control.recordBorderInfo(
            x,
            y + rowMargin,
            element.metrics.width,
            curRow.height - 2 * rowMargin
          )
        } else if (preElement?.control?.border) {
          this.control.drawBorder(ctx)
        }
        // 下划线记录
        if (element.underline || element.control?.underline) {
          // 下标元素下划线单独绘制
          if (
            preElement?.type === ElementType.SUBSCRIPT &&
            element.type !== ElementType.SUBSCRIPT
          ) {
            this.underline.render(ctx)
          }
          // 行间距
          const rowMargin = this.getElementRowMargin(element)
          // 元素向左偏移量
          const offsetX = element.left || 0
          // 下标元素y轴偏移值
          let offsetY = 0
          if (element.type === ElementType.SUBSCRIPT) {
            offsetY = this.subscriptParticle.getOffsetY(element)
          }
          // 占位符不参与颜色计算
          const color = element.control?.underline
            ? this.options.underlineColor
            : element.color
          this.underline.recordFillInfo(
            ctx,
            x - offsetX,
            y + curRow.height - rowMargin + offsetY,
            metrics.width + offsetX,
            0,
            color,
            element.textDecoration?.style
          )
        } else if (preElement?.underline || preElement?.control?.underline) {
          this.underline.render(ctx)
        }
        // 删除线记录
        if (element.strikeout) {
          // 仅文本类元素支持删除线
          if (!element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)) {
            // 字体大小不同时需立即绘制
            if (
              preElement &&
              ((preElement.type === ElementType.SUBSCRIPT &&
                  element.type !== ElementType.SUBSCRIPT) ||
                (preElement.type === ElementType.SUPERSCRIPT &&
                  element.type !== ElementType.SUPERSCRIPT) ||
                this.getElementSize(preElement) !==
                this.getElementSize(element))
            ) {
              this.strikeout.render(ctx)
            }
            // 基线文字测量信息
            const standardMetrics = this.textParticle.measureBasisWord(
              ctx,
              this.getElementFont(element)
            )
            // 文字渲染位置 + 基线文字下偏移量 - 一半文字高度
            let adjustY =
              y +
              offsetY +
              standardMetrics.actualBoundingBoxDescent * scale -
              metrics.height / 2
            // 上下标位置调整
            if (element.type === ElementType.SUBSCRIPT) {
              adjustY += this.subscriptParticle.getOffsetY(element)
            } else if (element.type === ElementType.SUPERSCRIPT) {
              adjustY += this.superscriptParticle.getOffsetY(element)
            }
            this.strikeout.recordFillInfo(ctx, x, adjustY, metrics.width)
          }
        } else if (preElement?.strikeout) {
          this.strikeout.render(ctx)
        }
        // 选区记录
        const { zone: currentZone, splitTdRange } = this.range.getRange()
        let { startIndex, endIndex } = this.range.getRange()
        // 是否是跨页单元格选区
        let isSplitTdRange = false
        if (
          td &&
          splitTdRange &&
          [td.originalId, td.id].includes(splitTdRange.originalId)
        ) {
          // 跨页单元格选区
          isSplitTdRange = true
          startIndex = splitTdRange.startIndex - (td.valueStartIndex ?? 0)
          endIndex = splitTdRange.endIndex - (td.valueStartIndex ?? 0)
        }
        if (
          currentZone === zone &&
          startIndex !== endIndex &&
          startIndex <= index &&
          index <= endIndex
        ) {
          const positionContext = this.position.getPositionContext()
          // 表格需限定上下文
          if (
            (!positionContext.isTable && !element.tdId) ||
            positionContext.tdId === element.tdId ||
            isSplitTdRange
          ) {
            // 从行尾开始-绘制最小宽度
            if (startIndex === index) {
              const nextElement = elementList[startIndex + 1]
              if (nextElement && nextElement.value === ZERO) {
                rangeRecord.x = x + metrics.width
                rangeRecord.y = y
                rangeRecord.height = curRow.height
                rangeRecord.width += this.options.rangeMinWidth
              }
            } else {
              let rangeWidth = metrics.width
              // 最小选区宽度
              if (rangeWidth === 0 && curRow.elementList.length === 1) {
                rangeWidth = this.options.rangeMinWidth
              }
              // 记录第一次位置、行高
              if (!rangeRecord.width) {
                rangeRecord.x = x
                rangeRecord.y = y
                rangeRecord.height = curRow.height
              }
              rangeRecord.width += rangeWidth
            }
          }
        }
        // 组信息记录
        if (!group.disabled && element.groupIds) {
          this.group.recordFillInfo(element, x, y, metrics.width, curRow.height)
        }
        index++
        // 绘制表格内元素
        if (element.type === ElementType.TABLE && !element.hide) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              this.drawRow(ctx, {
                elementList: td.value,
                positionList: td.positionList!,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                zone,
                isDrawLineBreak,
                td
              })
            }
          }
        }
      }
      // 绘制列表样式
      if (curRow.isList) {
        const listPosition = positionList[curRow.startIndex]
        if (listPosition) {
          this.listParticle.drawListStyle(
            ctx,
            curRow,
            listPosition
          )
        }
      }
      // 绘制文字、边框、下划线、删除线
      this.textParticle.complete()
      this.control.drawBorder(ctx)
      this.underline.render(ctx)
      this.strikeout.render(ctx)
      // 绘制批注样式
      this.group.render(ctx)
      // 绘制选区
      if (!isPrintMode && !isGraffitiMode) {
        if (rangeRecord.width && rangeRecord.height) {
          const { x, y, width, height } = rangeRecord
          this.range.render(ctx, x, y, width, height)
        }
        if (
          isCrossRowCol &&
          tableRangeElement &&
          tableRangeElement.id === tableId
        ) {
          const rangePosition = positionList[curRow.startIndex]
          if (rangePosition) {
            const {
              coordinate: {
                leftTop: [x, y]
              }
            } = rangePosition
            this.tableParticle.drawRange(ctx, tableRangeElement, x, y)
          }
        }
      }
    }
  }

  private _drawFloat(
    ctx: CanvasRenderingContext2D,
    payload: IDrawFloatPayload
  ) {
    const floatPositionList = this.position.getFloatPositionList()
    const { imgDisplays, pageNo } = payload
    for (let e = 0; e < floatPositionList.length; e++) {
      const floatPosition = floatPositionList[e]
      const element = floatPosition.element
      if (
        (pageNo === floatPosition.pageNo ||
          floatPosition.zone === EditorZone.HEADER ||
          floatPosition.zone == EditorZone.FOOTER) &&
        element.imgDisplay &&
        imgDisplays.includes(element.imgDisplay) &&
        element.type === ElementType.IMAGE
      ) {
        const { x, y } = this.position.getFloatPositionCoordinate(floatPosition)
        this.imageParticle.render(ctx, element, x, y)
      }
    }
  }

  private _clearPage(pageNo: number) {
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(
      0,
      0,
      Math.max(pageDom.width, this.getWidth()),
      Math.max(pageDom.height, this.getHeight())
    )
    this.blockParticle.clear()
  }

  private _drawPage(payload: IDrawPagePayload) {
    const { elementList, positionList, rowList, pageNo } = payload
    const {
      inactiveAlpha,
      pageMode,
      header,
      footer,
      pageNumber,
      lineNumber,
      pageBorder
    } = this.options
    const isPrintMode = this.mode === EditorMode.PRINT
    const isContinuityMode = pageMode === PageMode.CONTINUITY
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    // 判断当前激活区域-非正文区域时元素透明度降低
    ctx.globalAlpha = !this.zone.isMainActive() ? inactiveAlpha : 1
    this._clearPage(pageNo)
    // 绘制背景
    if (
      !isPrintMode ||
      !this.options.modeRule[EditorMode.PRINT]?.backgroundDisabled
    ) {
      this.background.render(ctx, pageNo)
    }
    // 绘制区域
    if (!isPrintMode) {
      this.area.render(ctx, pageNo)
    }
    // 绘制分栏分隔线
    this.columnManager.drawSeparator(ctx, pageNo)
    // 绘制水印（底层）
    if (
      !isContinuityMode &&
      this.options.watermark.data &&
      this.options.watermark.layer === WatermarkLayer.BOTTOM
    ) {
      this.waterMark.render(ctx, pageNo)
    }
    // 绘制页边距
    if (!isPrintMode) {
      this.margin.render(ctx, pageNo)
    }
    // 渲染衬于文字下方元素
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
    })
    // 控件高亮
    if (!isPrintMode) {
      this.control.renderHighlightList(ctx, pageNo)
    }
    // 渲染元素
    const index = rowList[0]?.startIndex
    this.drawRow(ctx, {
      elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      innerWidth,
      zone: EditorZone.MAIN
    })
    if (this.getIsPagingMode()) {
      // 绘制页眉
      if (!header.disabled) {
        this.header.render(ctx, pageNo)
      }
      // 绘制页码
      if (!pageNumber.disabled) {
        this.pageNumber.render(ctx, pageNo)
      }
      // 绘制页脚
      if (!footer.disabled) {
        this.footer.render(ctx, pageNo)
      }
    }
    // 渲染浮于文字上方元素
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
    })
    // 搜索匹配绘制
    if (!isPrintMode && this.search.getSearchKeyword()) {
      this.search.render(ctx, pageNo)
    }
    // 绘制空白占位符
    if (this.elementList.length <= 1 && !this.elementList[0]?.listId) {
      this.placeholder.render(ctx)
    }
    // 渲染行数
    if (!lineNumber.disabled) {
      this.lineNumber.render(ctx, pageNo)
    }
    // 绘制页面边框
    if (!pageBorder.disabled) {
      this.pageBorder.render(ctx)
    }
    // 绘制签章
    this.badge.render(ctx, pageNo)
    // 绘制涂鸦
    if (this.isGraffitiMode()) {
      this.graffiti.render(ctx, pageNo)
    }
    // 绘制水印（顶层）
    if (
      !isContinuityMode &&
      this.options.watermark.data &&
      this.options.watermark.layer === WatermarkLayer.TOP
    ) {
      this.waterMark.render(ctx, pageNo)
    }
  }

  private _disconnectLazyRender() {
    this.lazyRenderIntersectionObserver?.disconnect()
  }

  private _lazyRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    this._disconnectLazyRender()
    this.lazyRenderIntersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number((<HTMLCanvasElement>entry.target).dataset.index)
          this._drawPage({
            elementList,
            positionList,
            rowList: this.pageRowList[index],
            pageNo: index
          })
        }
      })
    })
    this.pageList.forEach(el => {
      this.lazyRenderIntersectionObserver!.observe(el)
    })
  }

  private _immediateRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    for (let i = 0; i < this.pageRowList.length; i++) {
      this._drawPage({
        elementList,
        positionList,
        rowList: this.pageRowList[i],
        pageNo: i
      })
    }
  }

  public render(payload?: IDrawOption) {
    this.renderCount++
    let curElement: IElement | null
    const { endIndex, isCrossRowCol } = this.range.getRange()
    const positionContext = this.position.getPositionContext()
    if (isCrossRowCol) {
      // 单元格选择以当前表格定位
      const originalElementList = this.getOriginalElementList()
      curElement = positionContext.index !== undefined
        ? originalElementList[positionContext.index]
        : null
    } else {
      const index = ~endIndex ? endIndex : 0
      // 行首以第一个非换行符元素定位
      const elementList = this.getElementList()
      curElement = getAnchorElement(elementList, index)
    }
    const { header, footer } = this.options
    const {
      isSubmitHistory = true,
      isSetCursor = true,
      isCompute = true,
      isLazy = true,
      isInit = false,
      isSourceHistory = false,
      isFirstRender = false
    } = payload || {}
    let { curIndex } = payload || {}
    const innerWidth = this.getInnerWidth()
    const isPagingMode = this.getIsPagingMode()
    // 缓存当前页数信息
    const oldPageSize = this.pageRowList.length
    // 计算文档信息
    if (isCompute) {
      // 需要重新计算文档信息 立即清空缓存
      this.splitTdValueMap.clear()
      this.tdMap.clear()
      // 清空浮动元素位置信息
      this.position.setFloatPositionList([])
      if (isPagingMode) {
        // 分栏信息
        this.columnManager.compute()
        // 页眉信息
        if (!header.disabled) {
          this.header.compute()
        }
        // 页脚信息
        if (!footer.disabled) {
          this.footer.compute()
        }
      }
      // 行信息
      const margins = this.getMargins()
      const pageHeight = this.getHeight()
      const extraHeight = this.header.getExtraHeight()
      const startX = margins[3]
      const startY = margins[0] + extraHeight
      const surroundElementList = pickSurroundElementList(this.elementList)
      this.rowList = this.computeRowList({
        startX,
        startY,
        pageHeight,
        isPagingMode,
        innerWidth,
        surroundElementList,
        elementList: this.elementList
      })
      // 页面信息
      this.pageRowList = this._computePageList()
      // 位置信息
      this.position.computePositionList()
      // 区域信息
      this.area.compute()
      if (!this.isPrintMode()) {
        // 搜索信息
        const searchKeyword = this.search.getSearchKeyword()
        if (searchKeyword) {
          this.search.compute(searchKeyword)
        }
        // 控件关键词高亮
        this.control.computeHighlightList()
      }
      // 涂鸦信息
      if (this.isGraffitiMode()) {
        this.graffiti.compute()
      }
    }
    // 清除光标等副作用
    this.imageObserver.clearAll()
    this.cursor.recoveryCursor()
    // 创建纸张
    for (let i = 0; i < this.pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
    }
    // 移除多余页
    const curPageCount = this.pageRowList.length
    const prePageCount = this.pageList.length
    if (prePageCount > curPageCount) {
      const deleteCount = prePageCount - curPageCount
      this.ctxList.splice(curPageCount, deleteCount)
      this.pageList
        .splice(curPageCount, deleteCount)
        .forEach(page => page.remove())
    }
    // 绘制元素
    // 连续页因为有高度的变化会导致canvas渲染空白，需立即渲染，否则会出现闪动
    if (isLazy && isPagingMode) {
      this._lazyRender()
    } else {
      this._immediateRender()
    }
    // 光标重绘
    if (isSetCursor) {
      // 检查当前光标对应的元素位置
      // 解决当前光标在拆分出来的单元格中重新计算后被合并导致通过position无法获取当前元素列表的bug
      if (isCompute && curElement?.tableId) {
        const { index } = positionContext
        const originalElementList = this.getOriginalElementList()
        const positionElement = originalElementList[index!]
        if (curElement.tableId !== positionElement?.id) {
          // 当前元素位置发生改变
          // 向前找当前元素
          const findRes = this.findTableChildrenElement(
            true,
            curElement.tableId,
            curElement
          )
          if (findRes && positionContext.index !== findRes.originalIndex) {
            // 找到了
            positionContext.index = findRes.originalIndex
            positionContext.tableId = findRes.table.id
            positionContext.trIndex = findRes.trIndex
            positionContext.trId = findRes.tr.id
            positionContext.tdIndex = findRes.tdIndex
            positionContext.tdId = findRes.td.id
            curIndex = findRes.elementIndex
            this.position.setPositionContext(positionContext)
            this.range.setRange(curIndex, curIndex)
            this.updateTableTool()
          }
        }
        const elementList = this.getElementList()
        if (elementList[endIndex] !== curElement) {
          // 元素位置发生变化
          curIndex = elementList.findIndex(element => element === curElement)
        }
      }
      curIndex = this.setCursor(curIndex)
    } else if (this.range.getIsSelection()) {
      // 存在选区时仅定位避免事件无法捕获
      this.cursor.focus()
    }
    // 历史记录用于undo、redo（非首次渲染内容变更 || 第一次存在光标时）
    if (
      (isSubmitHistory && !isFirstRender) ||
      (curIndex !== undefined && this.historyManager.isStackEmpty())
    ) {
      this.submitHistory(curIndex)
    }
    // 信息变动回调
    nextTick(() => {
      // 选区样式
      this.range.setRangeStyle()
      // 重新唤起弹窗类控件
      if (isCompute && this.control.getActiveControl()) {
        this.control.reAwakeControl()
      }
      // 表格工具重新渲染
      if (isCompute && !this.isReadonly() && positionContext.isTable) {
        const originalElementList = this.getOriginalElementList()
        if (
          originalElementList[positionContext.index!].type === ElementType.TABLE
        ) {
          this.tableTool.render()
        }
      }
      // 页眉指示器重新渲染
      if (isCompute && !this.zone.isMainActive()) {
        this.zone.drawZoneIndicator()
      }
      // 页数改变
      if (oldPageSize !== this.pageRowList.length) {
        if (this.listener.pageSizeChange) {
          this.listener.pageSizeChange(this.pageRowList.length)
        }
        if (this.eventBus.isSubscribe('pageSizeChange')) {
          this.eventBus.emit('pageSizeChange', this.pageRowList.length)
        }
      }
      // 文档内容改变
      if ((isSubmitHistory || isSourceHistory) && !isInit) {
        if (this.listener.contentChange) {
          this.listener.contentChange()
        }
        if (this.eventBus.isSubscribe('contentChange')) {
          this.eventBus.emit('contentChange')
        }
      }
      // 修复光标位置
      isSetCursor && this.fixPosition()
    })
  }

  public setCursor(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const positionList = this.position.getPositionList()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      const elementList = this.getOriginalElementList()
      const tablePositionList =
        elementList[index!].trList?.[trIndex!].tdList[tdIndex!].positionList
      if (curIndex === undefined && tablePositionList) {
        curIndex = tablePositionList.length - 1
      }
      const tablePosition = tablePositionList?.[curIndex!]
      this.position.setCursorPosition(tablePosition || null)
    } else {
      this.position.setCursorPosition(
        curIndex !== undefined ? positionList[curIndex] : null
      )
    }
    // 定位到图片元素并且位置发生变化
    let isShowCursor = true
    if (
      curIndex !== undefined &&
      positionContext.isImage &&
      positionContext.isDirectHit
    ) {
      const elementList = this.getElementList()
      const element = elementList[curIndex]
      if (IMAGE_ELEMENT_TYPE.includes(element.type!)) {
        isShowCursor = false
        const position = this.position.getCursorPosition()
        this.previewer.updateResizer(element, position)
      }
    }
    this.cursor.drawCursor({
      isShow: isShowCursor
    })
    return curIndex
  }

  public submitHistory(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const oldElementList = getSlimCloneElementList(this.elementList)
    const oldHeaderElementList = getSlimCloneElementList(
      this.header.getElementList()
    )
    const oldFooterElementList = getSlimCloneElementList(
      this.footer.getElementList()
    )
    const oldRange = deepClone(this.range.getRange())
    const pageNo = this.pageNo
    const oldPositionContext = deepClone(positionContext)
    const zone = this.zone.getZone()
    this.historyManager.execute(() => {
      this.zone.setZone(zone)
      this.setPageNo(pageNo)
      this.position.setPositionContext(deepClone(oldPositionContext))
      this.header.setElementList(deepClone(oldHeaderElementList))
      this.footer.setElementList(deepClone(oldFooterElementList))
      this.elementList = deepClone(oldElementList)
      this.range.replaceRange(deepClone(oldRange))
      this.render({
        curIndex,
        isSubmitHistory: false,
        isSourceHistory: true
      })
    })
  }

  public destroy() {
    this.container.remove()
    this.globalEvent.removeEvent()
    this.scrollObserver.removeEvent()
    this.selectionObserver.removeEvent()
    this.workerManager.destroy()
    this.magnifier.destroy()
    this.accessibility.destroy()
    this.lazyRenderIntersectionObserver?.disconnect()
  }

  public clearSideEffect() {
    // 预览工具组件
    this.getPreviewer().clearResizer()
    // 表格工具组件
    this.getTableTool().dispose()
    // 超链接弹窗
    this.getHyperlinkParticle().clearHyperlinkPopup()
    // 日期控件
    this.getDateParticle().clearDatePicker()
  }

  // 更新表格工具栏
  public updateTableTool() {
    if (this.position.getPositionContext().isTable) {
      const list = this.position.getPositionList()
      if (list.length) {
        this.setPageNo(list[0].pageNo)
        this.getTableTool().render()
      }
    }
  }

  public getTdByPosition(positionContext: IPositionContext): ITd | null {
    const { index, trIndex, tdIndex, isTable, tdId } = positionContext
    if (isTable) {
      // 优先使用 tdId 从 tdMap 获取，这样更可靠
      if (tdId && this.tdMap.has(tdId)) {
        return this.tdMap.get(tdId)!
      }
      // 降级方案：使用索引查找
      const elementList = this.getOriginalElementList()
      const element = elementList[index!]
      if (element?.trList?.[trIndex!]) {
        return element.trList[trIndex!].tdList[tdIndex!] || null
      }
      return null
    }
    return null
  }

  public initTableElementIndex(element: IElement, index?: number) {
    element.trList?.forEach((tr, trIndex) => {
      tr.tdList.forEach((td, tdIndex) => {
        td.tableIndex = index
        td.tableId = element.id
        td.trIndex = trIndex
        td.trId = tr.id
        td.tdIndex = tdIndex
        this.tdMap.set(td.id!, td)
      })
    })
  }

  public clearElementEffect(element: IElement) {
    element.trList?.forEach(tr => {
      tr.minHeight = tr.originalMinHeight ?? tr.minHeight
      delete tr.originalMinHeight
      tr.tdList.forEach(td => {
        delete td.linkTdNextId
      })
    })
  }

  public updateElementTableInfo(
    element: IElement,
    table: IElement,
    tr: ITr,
    td: ITd
  ) {
    element.tableId = table.id
    element.trId = tr.id
    element.tdId = td.id
    return element
  }

  public findTableChildrenElement(
    prev: boolean,
    tableId: string,
    findTarget: IElement | ((curElement: IElement) => any)
  ): FindTableChildrenElementRes | undefined {
    const position = this.position.getPositionContext()
    const { index } = position
    const originalElementList = this.getOriginalElementList()
    let startIndex = index!
    if (prev) {
      startIndex =
        index! > originalElementList.length
          ? originalElementList.length - 1
          : index!
    }
    for (
      let i = startIndex;
      prev ? i >= 0 : i < originalElementList.length;
      prev ? i-- : i++
    ) {
      const element = originalElementList[i]
      if (element && [element.originalId, element.id].includes(tableId)) {
        // 是当前表格
        for (const [trIndex, tr] of element.trList!.entries()) {
          for (const [tdIndex, td] of tr.tdList!.entries()) {
            const findIndex = td.value.findIndex(
              typeof findTarget === 'function'
                ? findTarget
                : el => el === findTarget
            )
            if (findIndex >= 0) {
              return {
                originalIndex: i,
                table: element,
                tr,
                trIndex,
                td,
                tdIndex,
                elementIndex: findIndex
              }
            }
          }
        }
      }
    }
    return undefined
  }

  public getTdById(id: string) {
    return this.tdMap.get(id)
  }

  public getLinkTdPrevHasValue(prevTdId: string): ITd | undefined {
    const prevTd = this.getTdById(prevTdId)
    if (prevTd) {
      if (prevTd.value.length) {
        return prevTd
      } else {
        return this.getLinkTdPrevHasValue(prevTd.linkTdPrevId!)
      }
    }
    return
  }

  public getFirstLinkTd(id: string): ITd | undefined {
    const td = this.getTdById(id)
    if (td?.linkTdPrevId) {
      return this.getLastLinkTd(td.linkTdPrevId)
    }
    return td
  }

  public getLastLinkTd(id: string): ITd | undefined {
    const td = this.getTdById(id)
    if (td?.linkTdNextId) {
      return this.getLastLinkTd(td.linkTdNextId)
    }
    return td
  }

  public removeLinkTd(elementList: IElement[], id: string) {
    const td = this.getTdById(id)
    if (td) {
      if (td.linkTdPrevId) {
        const prevTd = this.getTdById(td.linkTdPrevId)
        if (prevTd) {
          delete prevTd.linkTdNextId
          this.removeLinkTd(elementList, td.linkTdPrevId)
        }
      }
      if (td.linkTdNextId) {
        const nextTd = this.getTdById(td.linkTdNextId)
        if (nextTd) {
          delete nextTd.linkTdPrevId
          this.removeLinkTd(elementList, td.linkTdNextId)
        }
      }
      elementList[td.tableIndex!].trList![td.trIndex!].tdList.splice(
        td.tdIndex!,
        1
      )
      this.initTableElementIndex(elementList[td.tableIndex!], td.tableIndex!)
    }
  }

  public removeLinkTdControl(tdId: string, control: IControl) {
    const td = this.getTdById(tdId)
    if (td) {
      for (let i = 0; i < td.value.length; i++) {
        if (td.value[i].control === control) {
          td.value.splice(i, 1)
          i--
        }
      }
      if (td.linkTdNextId) {
        this.removeLinkTdControl(td.linkTdNextId, control)
      }
    }
  }

  public isSplitTd(tdA: ITd, tdB: ITd): boolean {
    return (
      (!!tdA?.originalId || !!tdB?.originalId) &&
      (tdA?.originalId === tdB?.originalId ||
        tdA?.id === tdB?.originalId ||
        tdA?.originalId === tdB?.id)
    )
  }

  public getAllLinkTds(id: string): ITd[] {
    const result: ITd[] = []
    const td = this.getTdById(id)
    if (!td) return result

    // 添加当前单元格
    result.push(td)

    // 向前查找
    let prevTd = td.linkTdPrevId ? this.getTdById(td.linkTdPrevId) : null
    while (prevTd) {
      result.unshift(prevTd)
      prevTd = prevTd.linkTdPrevId ? this.getTdById(prevTd.linkTdPrevId) : null
    }

    // 向后查找
    let nextTd = td.linkTdNextId ? this.getTdById(td.linkTdNextId) : null
    while (nextTd) {
      result.push(nextTd)
      nextTd = nextTd.linkTdNextId ? this.getTdById(nextTd.linkTdNextId) : null
    }

    return result
  }

  public getSplitTdValues(originalId: string) {
    return this.splitTdValueMap.get(originalId)
  }

  public removeSplitTdOtherRangeElements() {
    const { splitTdRange } = this.range.getRange()
    if (!splitTdRange) {
      return
    }
    const { startIndex, endIndex } = splitTdRange
    let curTd = this.getTd()
    if (curTd) {
      if ((curTd.valueStartIndex ?? 0) >= startIndex) {
        let tdStartIndex = -1
        while (tdStartIndex < 0) {
          // 当前td是结束单元格
          const prevTd = this.getTdById(curTd.linkTdPrevId!)
          if (prevTd) {
            tdStartIndex = startIndex - (prevTd.valueStartIndex ?? 0)
            const start = Math.max(0, tdStartIndex)
            this.spliceElementList(
              prevTd.value,
              start + 1,
              prevTd.value.length - start - 1
            )
            curTd = prevTd
          } else {
            // 退出循环
            tdStartIndex = 0
          }
        }
      } else {
        // 当前td是开始单元格
        let tdEndIndex = 1
        while (tdEndIndex > 0) {
          const nextTd = this.getTdById(curTd.linkTdNextId!)
          if (nextTd) {
            const tdStartIndex = nextTd.valueStartIndex ?? 0
            tdEndIndex = endIndex - (tdStartIndex + nextTd.value.length)
            const deleteCount = Math.min(
              nextTd.value.length,
              endIndex - tdStartIndex + 1
            )
            this.spliceElementList(nextTd.value, 0, deleteCount)
            curTd = nextTd
          } else {
            tdEndIndex = 0
          }
        }
      }
    }
  }

  public fixPosition(prev = false): number | undefined {
    let newStartIndex: number | undefined = undefined
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable && positionContext.index !== undefined) {
      // 渲染完成后修复单元格拆分光标位置
      const list = this.getElementList()
      const startIndex = this.range.getRange().startIndex

      // 检查当前单元格是否存在
      const curTd = this.getTd()

      // 检查是否需要修复：
      // 1. prev 为 true（向前查找）
      // 2. startIndex 超出当前单元格元素列表长度
      // 3. 当前单元格不存在（可能表格已重新分页）
      const needsFix = prev || startIndex >= list.length || !curTd

      if (needsFix) {
        const elementList = this.getOriginalElementList()

        // 如果当前单元格存在，使用原有逻辑
        if (curTd) {
          const index = positionContext.index! + (prev ? -1 : 1)
          const table = elementList[index]
          if (!table?.trList) {
            return
          }
          newStartIndex = startIndex - list.length
          for (let trIndex = 0; trIndex < table.trList!.length; trIndex++) {
            const tr = table.trList![trIndex]
            const findTd = tr.tdList.find(td =>
              prev ? curTd?.linkTdPrevId === td.id : curTd?.id === td.linkTdPrevId
            )
            if (findTd) {
              positionContext.index = index
              positionContext.trIndex = trIndex
              positionContext.tableId = table.id
              positionContext.trId = tr.id
              positionContext.tdId = findTd?.id
              newStartIndex = prev
                ? findTd.value.length - 1
                : newStartIndex +
                  (findTd.value[0]?.type === ElementType.SPLIT_TAG ? 1 : 0)
              break
            }
          }
        } else {
          // 当前单元格不存在，需要在所有分页表格中搜索
          // 使用 positionContext.tdId 和 linkTdPrevId 搜索
          let pagingId: string | null | undefined = positionContext.tableId
            ? elementList.find(el => el.id === positionContext.tableId)?.pagingId
            : null

          // 如果通过 tableId 查找失败（表格已被合并），通过 tdId 在各表格中搜索 pagingId
          if (!pagingId && positionContext.tdId) {
            for (const el of elementList) {
              if (el.type !== ElementType.TABLE || !el.pagingId || !el.trList) continue
              for (const tr of el.trList) {
                if (tr.tdList.some(td =>
                  td.id === positionContext.tdId ||
                  td.linkTdPrevId === positionContext.tdId ||
                  td.originalId === positionContext.tdId
                )) {
                  pagingId = el.pagingId
                  break
                }
              }
              if (pagingId) break
            }
          }

          if (pagingId) {
            // 搜索所有具有相同 pagingId 的表格
            for (let ti = 0; ti < elementList.length; ti++) {
              const table = elementList[ti]
              if (table.pagingId !== pagingId || table.type !== ElementType.TABLE) continue

              for (let trIndex = 0; trIndex < table.trList!.length; trIndex++) {
                const tr = table.trList![trIndex]
                const findTd = tr.tdList.find(td =>
                  td.id === positionContext.tdId ||
                  td.linkTdPrevId === positionContext.tdId ||
                  td.originalId === positionContext.tdId
                )
                if (findTd) {
                  positionContext.index = ti
                  positionContext.trIndex = trIndex
                  positionContext.tableId = table.id
                  positionContext.trId = tr.id
                  positionContext.tdId = findTd.id

                  // 计算新的索引
                  if (findTd.positionList && findTd.positionList.length > 0) {
                    newStartIndex = Math.min(startIndex, findTd.positionList.length - 1)
                    if (newStartIndex < 0) newStartIndex = 0
                  } else {
                    newStartIndex = 0
                  }
                  break
                }
              }
              if (newStartIndex !== undefined) break
            }
          }
        }

        if (newStartIndex !== undefined) {
          this.position.setPositionContext(positionContext)
          this.range.setRange(newStartIndex, newStartIndex)
          this.setCursor(newStartIndex)
          if (newStartIndex === 0) {
            return this.fixPosition(prev)
          }
          this.updateTableTool()
        }
      }
    }
    return newStartIndex
  }

  public getTablesByPagingId(
    elementList: IElement[],
    pagingId: string,
    index: number
  ): { list: IElement[]; startIndex: number } {
    const list: IElement[] = []
    let startIndex = index
    // 找到分页表格的起始位置
    for (let i = index; i >= 0; i--) {
      if (elementList[i].pagingId === pagingId) {
        startIndex = i
      } else {
        break
      }
    }
    // 收集所有分页表格
    for (let i = startIndex; i < elementList.length; i++) {
      if (elementList[i].pagingId === pagingId) {
        list.push(elementList[i])
      } else {
        break
      }
    }
    return { list, startIndex }
  }
}
